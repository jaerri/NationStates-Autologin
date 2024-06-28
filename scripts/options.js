import { Auth, pingAll } from "./api.js";

const /** @type {HTMLFormElement} */
    form = document.getElementById("input-form"),
    /** @type {HTMLInputElement} */
    nation = document.getElementById("input-nation"),
    /** @type {HTMLInputElement} */
    password = document.getElementById("input-password"),
    /** @type {HTMLParagraphElement} */
    indicator = document.getElementById("status-indicator");

form.addEventListener('submit', event => {
    event.preventDefault();
    let auth = new Auth(nation.value);
    auth.register(password.value).then(response => {
        indicator.innerHTML = "Status " + response.status + " OK!"; 
        indicator.style.color = "#4BB543";
        refreshNationList();
    }).catch(response => {
        indicator.innerHTML = "Status " + response.status + " ERR!";
        indicator.style.color = "red";
    });
});

const /** @type {HTMLButtonElement} */
    pingAllButton = document.getElementById("ping-all"),
    /** @type {HTMLUListElement} */
    nationList = document.getElementById("nation-list");

pingAllButton.addEventListener("click", pingAll);
refreshNationList();

function refreshNationList() {
    nationList.replaceChildren();
    chrome.storage.local.get().then(nations => {
        for (let nation in nations) {
            let li = nationList.appendChild(document.createElement("li"));
            let button = li.appendChild(document.createElement("button"));
            let span = li.appendChild(document.createElement("span"));
            span.textContent = nation;
            button.textContent = "X";
            button.addEventListener("click", event => {
                if (!confirm(`Remove "${nation}" from list?`)) return;
                new Auth(nation).remove().then(refreshNationList);
            });
        }
    });
}