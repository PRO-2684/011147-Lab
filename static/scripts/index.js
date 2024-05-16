const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const log = console.log.bind(console, "[index.js]");

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString(options = {hour12: false});
}

async function onLogin(e) {
    e.preventDefault();
    const tip = $("#login-tip");
    const detail = $("#login-detail");
    const formData = new FormData(this);
    const postData = {};
    formData.forEach((value, key) => {
        postData[key] = value;
    });
    const url = this.getAttribute("action");
    const method = this.getAttribute("method");
    log(">>>", postData);
    tip.style.color = "gray";
    tip.textContent = "Logging in...";
    detail.textContent = formatTime();
    const r = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
    });
    const respData = await r.json();
    log("<<<", respData);
    if (respData.success) {
        const role = respData.isAdmin ? "admin" : "student";
        const username = respData.isAdmin ? respData.data[1] : respData.data[0];
        const password = respData.isAdmin ? respData.data[2] : respData.data[1];
        const token = respData.token;
        const loginInfo = {
            isAdmin: respData.isAdmin,
            username: username,
            password: password,
            token: token,
        };
        localStorage.setItem("loginInfo", JSON.stringify(loginInfo));
        tip.style.color = "green";
        tip.textContent = `Logged in successfully as ${role} "${username}"! Redirecting...`;
        detail.innerHTML = "";
        const link = detail.appendChild(document.createElement("a"));
        link.href = `/${role}.html`;
        link.textContent = "Click here if not automatically redirected.";
        setTimeout(() => {
            window.location.href = `/${role}.html`;
        }, 1000);
    } else {
        tip.style.color = "red";
        tip.textContent = "Login failed, please check your role, username and password.";
        detail.textContent = formatTime();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = $("#login-form");
    const tip = $("#login-tip");
    const detail = $("#login-detail");
    loginForm.addEventListener("submit", onLogin);
    const loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) {
        const {isAdmin, username, password, token} = JSON.parse(loginInfo);
        tip.style.color = "green";
        tip.textContent = `You're already logged in as ${isAdmin ? "admin" : "student"} "${username}".`;
        const role = isAdmin ? "admin" : "student";
        const link = detail.appendChild(document.createElement("a"));
        link.href = `/${role}.html`;
        link.textContent = "Click here to continue.";
    }
});
