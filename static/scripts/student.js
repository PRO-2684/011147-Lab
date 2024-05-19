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
            const ul = panel.querySelector("ul");
            ul.toggleAttribute("data-busy", true);
            const data = await window.common.postWithToken("/api/student/info");
            if (!data.success) {
                log("Failed to reload info panel.");
            } else {
                const spans = ul.querySelectorAll("span");
                for (let i = 0; i < spans.length; i++) {
                    spans[i].textContent = data.data[i];
                }
            }
            ul.toggleAttribute("data-busy", false);
            log("Reloaded info panel.");
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
