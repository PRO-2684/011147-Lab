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

    function assertLoggedIn() {
        if (!window.loginInfo || !window.loginInfo.token) {
            log("Not logged in!");
            window.location.href = "/index.html";
        }
    }

    async function logout() {
        const r = await fetch("/api/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: window.loginInfo.token }),
        });
        const respData = await r.json();
        const success = respData.success;
        if (success) {
            window.loginInfo = null;
            log("Logout success!");
        } else {
            log("Logout failed!");
        }
        return success;
    }

    Object.defineProperty(window, "common", {
        value: {
            assertLoggedIn,
            logout
        },
    });
})();
