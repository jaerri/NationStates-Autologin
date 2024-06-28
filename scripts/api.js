const baseURL = "https://www.nationstates.net/cgi-bin/api.cgi";

export function pingAll() {
    chrome.storage.local.get().then(nations => {
        for (let nation in nations) 
            ping(nation).catch(response => {
                console.log(response);
                console.log('Did you change the password of "' + nation + '"?');
            });
    });
}
async function ping(nation, auth) {
    let query = {
        nation: nation,
        q: "ping",
    };
    if (!auth) {
        auth = new Auth(nation);
        await auth.getAuth();
    }
    try { 
        let response = await api(query, auth); 
        let text = await response.clone().text();
        console.log("====================");
        console.log("Nation:", nation);
        console.log(text);
        return response;
    }
    catch (res) { throw res; }
}
async function api(query, auth) {
    let url = new URL(baseURL +'?'+ new URLSearchParams(query).toString());
    let response = await fetch(url, {headers: auth.getLoginHeader()});
    if (!response.ok) throw await responseErrHandler(response);;
    return response;
}
async function responseErrHandler(response) {
    let err = (await response.clone().text()).match(/(?<=>).*$(?<!>)/gm).join("\n");
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: chrome.runtime.getManifest().name + " Error",
        message: err + " (check console)",
        priority: 0
    });
    console.log(err);
    return response;
}
export class Auth {
    nation;
    auth;
    isAutologin;
    constructor(nation) {
        this.nation = nation;
    }
    async getAuth() {
        let item = await chrome.storage.local.get(this.nation);
        let value = item[this.nation];
        if (!value) throw "No autologin found!";
        this.auth = item[this.nation];
        this.isAutologin = true;
        return value;
    }
    async register(password) {
        this.auth = password;
        this.isAutologin = false;
        try {
            let response = await ping(this.nation, this).catch(err => {throw err;});
            let autologin = response.headers.get("X-Autologin");
            if (!autologin) throw "No Autologin found!";
            let text = await response.clone().text();
            this.nation = extractNationName(text);
            console.log("====================");
            console.log("Nation:", this.nation);
            console.log(text);

            let keyvalue = {};
            keyvalue[this.nation] = autologin
            await chrome.storage.local.set(keyvalue);
            return response;
        } catch (err) { throw err; }
    }
    async remove() {
        await chrome.storage.local.remove(this.nation).catch(console.log);
        return "Successfully removed: " + this.nation;
    }
    getLoginHeader() {
        if (this.isAutologin) return { "X-Autologin": this.auth }
        else if (this.isAutologin===false) return { "X-Password": this.auth }
        else return {};
    }
}
function extractNationName(text) {
    return text.match(/(?<=id=").*?(?=")/)[0];
}