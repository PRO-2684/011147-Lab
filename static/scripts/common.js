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

    async function submit(e, withToken = false) {
        // Transform form data to JSON and send it to the server
        e.preventDefault();
        const formData = new FormData(e.target);
        const postData = {};
        formData.forEach((value, key) => {
            postData[key] = value;
        });
        e.target.querySelectorAll("input[type='number']").forEach((el) => {
            // Convert number strings to numbers
            postData[el.name] = Number(postData[el.name]);
        });
        const url = e.target.getAttribute("action") ?? location.href;
        const method = e.target.getAttribute("method");
        if (withToken) {
            postData.token = window.loginInfo?.token;
        }
        log(">>>", postData);
        const r = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postData),
        });
        const respData = await r.json();
        log("<<<", respData);
        return respData;
    }

    async function assertLoggedIn() {
        if (!window.loginInfo || !window.loginInfo.token) {
            log("Not logged in!");
            window.location.replace("/index.html");
            return false;
        }
        const loggedIn = await refreshLoginStatus();
        if (!loggedIn) {
            window.location.replace("/index.html");
        }
        return loggedIn;
    }

    async function postWithToken(url, data = {}) {
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
        if (!window.loginInfo?.token) {
            return false;
        }
        const r = await postWithToken("/api/whoami");
        const { success, data } = r;
        if (success) {
            log("Logged in as:", data);
            Object.assign(window.loginInfo, data);
        } else {
            log("Token expired!");
            window.loginInfo = { ...window.loginInfo, token: null };
        }
        return success;
    }

    async function logout() {
        const respData = await postWithToken("/api/logout");
        window.loginInfo = { ...window.loginInfo, token: null };
        if (respData.success) {
            log("Logout success!");
            return true;
        } else {
            log("Logout failed!");
            return false;
        }
    }

    function initNav(panels, nav) {
        function showPanel(panelId) {
            log("Show panel:", panelId);
            for (const anchor of nav.children) {
                anchor.toggleAttribute('data-active', anchor.getAttribute('data-panel') === panelId);
            }
            panels.addEventListener("transitionend", () => {
                for (const panel of panels.children) {
                    panel.toggleAttribute('data-active', panel.id === panelId);
                }
                panels.style.opacity = 1;
            }, { once: true });
            panels.style.opacity = 0;
        }

        // Generate anchors
        for (const panel of panels.children) {
            const anchor = document.createElement('a');
            anchor.href = '#' + panel.id;
            anchor.setAttribute('data-panel', panel.id);
            anchor.textContent = panel.id.charAt(0).toUpperCase() + panel.id.slice(1);
            nav.appendChild(anchor);
        }

        // Handle popstate event
        window.addEventListener('popstate', (event) => {
            const panelId = location.hash.substring(1) || panels[0].id; // remove the leading '#'
            showPanel(panelId);
        });

        // Show the initial panel based on the current URL hash
        if (location.hash) {
            showPanel(location.hash.substring(1));
        } else {
            location.hash = panels.children[0].id;
        }
    }

    function initFloatButtons(reloadFunc) {
        // Refresh button
        async function onRefresh(e) {
            const btn = e.target;
            const isDisabled = btn.hasAttribute('data-busy');
            if (isDisabled) return;
            const panelId = nav.querySelector('[data-active]').getAttribute('data-panel');
            btn.toggleAttribute('data-busy', true);
            await reloadFunc($("#" + panelId));
            btn.toggleAttribute('data-busy', false);
        }
        const refreshBtn = $("#op-refresh");
        const logoutBtn = $("#op-logout");
        const topBtn = $("#op-top");
        refreshBtn.addEventListener('click', onRefresh);
        logoutBtn.addEventListener('click', async () => {
            await window.common.logout();
            alert("You've logged out and will be redirected soon.");
            window.location.href = "/index.html";
        });
        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0 });
        });
    }

    Object.defineProperty(window, "common", {
        value: {
            submit,
            assertLoggedIn,
            postWithToken,
            refreshLoginStatus,
            logout,
            initNav,
            initFloatButtons
        },
    });
})();
