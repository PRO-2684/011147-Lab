(function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[common.js]");

    Object.defineProperty(window, "loginInfo", {
        get: function () {
            return JSON.parse(localStorage.getItem("loginInfo") ?? "null");
        },
        set: function (value) {
            if (!value) {
                localStorage.removeItem("loginInfo");
            } else {
                localStorage.setItem("loginInfo", JSON.stringify(value));
            }
        },
    });

    async function assertLoggedIn() {
        if (!window.loginInfo || !window.loginInfo.token) {
            log("Not logged in!");
            window.location.href = "/index.html";
        }
        const loggedIn = await refreshLoginStatus();
        if (!loggedIn) {
            window.location.href = "/index.html";
        }
    }

    async function postWithToken(url, data={}) {
        const token = window.loginInfo?.token;
        if (!token) {
            log("Not logged in!");
            throw new Error("Not logged in!");
        }
        data.token = token;
        const r = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return await r.json();
    }

    async function refreshLoginStatus() {
        const r = await postWithToken("/api/whoami");
        const { success, data } = r;
        if (success) {
            log("Logged in as:", data);
            Object.assign(window.loginInfo, data);
        } else {
            log("Token expired!");
        }
        return success;
    }

    async function logout() {
        const respData = await postWithToken("/api/logout");
        if (respData.success) {
            window.loginInfo = null;
            log("Logout success!");
        } else {
            log("Logout failed!");
        }
    }

    Object.defineProperty(window, "common", {
        value: {
            assertLoggedIn,
            postWithToken,
            refreshLoginStatus,
            logout
        },
    });
})();
