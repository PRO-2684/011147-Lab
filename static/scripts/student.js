(function() {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[student.js]");
    const { DataTable } = window.simpleDatatables;
    
    const assertion = window.common.assertLoggedIn();
    window.addEventListener("DOMContentLoaded", async (event) => {
        if (!(await assertion)) return;
        const panels = $("#panels").children;
        const nav = $('#nav');
        const mapping = {
            "info": reloadInfo,
            "courses": reloadTable,
            "grades": reloadTable,
        };
        const dataTables = {};
        window.common.initNav(panels, nav);
        // Expose dataTables to `window` for debugging
        location.search.includes("debug=true") && (window.dataTables = dataTables);

        async function reloadPanel(panel) {
            const reloadFunc = mapping[panel.id];
            if (reloadFunc) {
                await reloadFunc(panel);
            }
        }

        async function reloadInfo(panel) {
            initInfo(panel);
            panel.toggleAttribute("data-busy", true);
            // Reload text fields
            const ul = panel.querySelector("ul");
            const form = panel.querySelector("form");
            const data = await window.common.postWithToken("/api/student/info");
            if (!data.success) {
                log("Failed to reload info panel.");
            } else {
                const spans = ul.querySelectorAll("span");
                for (let i = 0; i < spans.length; i++) {
                    const span = spans[i];
                    span.textContent = data.data[i];
                    if (span.hasAttribute("id")) {
                        const input = form.querySelector(`input[name="${span.id}"]`);
                        input.value = data.data[i];
                        span.title = "Double click to edit";
                        span.addEventListener("dblclick", () => {
                            input.scrollIntoView();
                            input.focus();
                        });
                    }
                }
            }
            // Reload user profile image
            const img = panel.querySelector("img#profile");
            const r = await fetch("/api/student/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: window.loginInfo.token }),
            });
            const imgData = await r.blob();
            if (img.src) {
                URL.revokeObjectURL(img.src);
            }
            img.src = URL.createObjectURL(imgData);
            panel.toggleAttribute("data-busy", false);
            log("Reloaded info panel.");
        }

        function initInfo(panel) {
            const form = panel.querySelector("form");
            if (form.hasAttribute("data-initialized")) {
                return;
            }
            async function onUpdate(e) {
                e.preventDefault();
                panel.toggleAttribute("data-busy", true);
                const respData = await window.common.submit(e, true);
                if (respData.success) {
                    log("Info updated!");
                    await reloadInfo(panel);
                } else {
                    const error = "Failed to update info!";
                    log(error);
                    alert(error);
                }
                panel.toggleAttribute("data-busy", false);
            }
            form.addEventListener("submit", onUpdate);
            form.toggleAttribute("data-initialized", true);
            log("Info panel initialized!");
        }

        async function reloadTable(panel) {
            initTable(panel);
            const dataTable = dataTables[panel.id];
            dataTable.setMessage("Loading...");
            dataTable.wrapperDOM.toggleAttribute("data-busy", true);
            const data = await window.common.postWithToken(`/api/student/${panel.id}`);
            dataTable.data.data = [];
            dataTable.insert({ data: data.data });
            dataTable.wrapperDOM.toggleAttribute('data-busy', false);
            log(`Reloaded table "${panel.id}".`);
        }

        function initTable(panel) {
            if (dataTables[panel.id]) {
                return;
            }
            const table = panel.querySelector('table');
            const dataTable = new DataTable(table);
            dataTables[panel.id] = dataTable;
            log(`Table "${panel.id}" initialized!`);
        }
        
        // Float buttons
        window.common.initFloatButtons(reloadPanel);

        // Load the panels
        for (const panel of panels) {
            await reloadPanel(panel);
        }
    })
})();
