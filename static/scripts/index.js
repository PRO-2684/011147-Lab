const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const log = console.log.bind(console, "[index.js]");

async function onLogin(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    const url = this.getAttribute("action");
    const method = this.getAttribute("method");
    const r = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    log(await r.text());
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = $("#login-form");
    loginForm.addEventListener("submit", onLogin);
});
