(function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[index.js]");

    function formatTime() {
        const now = new Date();
        return now.toLocaleTimeString(options = { hour12: false });
    }

    async function onLogin(e) {
        const tip = $("#login-tip");
        const detail = $("#login-detail");
        tip.style.color = "gray";
        tip.textContent = "Logging in...";
        detail.textContent = formatTime();
        const respData = await window.common.submit(e);
        if (respData.success) {
            const role = respData.isAdmin ? "admin" : "student";
            const username = respData.isAdmin ? respData.data[1] : respData.data[0];
            const password = respData.isAdmin ? respData.data[2] : respData.data[1];
            const token = respData.token;
            window.loginInfo = {
                isAdmin: respData.isAdmin,
                username: username,
                password: password,
                token: token,
            };
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

    document.addEventListener("DOMContentLoaded", async () => {
        await window.common.refreshLoginStatus();
        const loginForm = $("#login-form");
        const tip = $("#login-tip");
        const detail = $("#login-detail");
        loginForm.addEventListener("submit", onLogin);
        if (window.loginInfo) {
            const { isAdmin, username, password, token } = loginInfo;
            // Auto refill the form
            $("#login-form input[name='username']").value = username;
            $("#login-form input[name='password']").value = password;
            $("#login-form input[name='is_admin'][type='checkbox']").checked = isAdmin;
            if (token) {
                // Tip the user that they're already logged in
                tip.style.color = "green";
                tip.textContent = `You're already logged in as ${isAdmin ? "admin" : "student"} "${username}".`;
                const role = isAdmin ? "admin" : "student";
                const link = detail.appendChild(document.createElement("a"));
                link.href = `/${role}.html`;
                link.textContent = "Click here to continue.";
            }
        }
    });
})();
