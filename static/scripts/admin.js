(function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[admin.js]");
    const { DataTable, makeEditable } = window.simpleDatatables;

    window.common.assertLoggedIn();
    window.addEventListener('DOMContentLoaded', (event) => {
        const panels = $("#panels").children;
        const nav = $('#nav');

        function showPanel(panelId) {
            for (const panel of panels) {
                panel.toggleAttribute('data-active', panel.id === panelId);
            }
            for (const anchor of nav.children) {
                anchor.toggleAttribute('data-active', anchor.getAttribute('data-panel') === panelId);
            }
        }

        for (const panel of panels) {
            // Generate anchors
            const anchor = document.createElement('a');
            anchor.href = '#' + panel.id;
            anchor.setAttribute('data-panel', panel.id);
            anchor.textContent = panel.id.charAt(0).toUpperCase() + panel.id.slice(1);
            nav.appendChild(anchor);
            // Tables
            const table = panel.querySelector('table');
            const dataTable = new DataTable(table);
            const editor = makeEditable(dataTable, {
                contextMenu: true,
                hiddenColumns: true,
                excludeColumns: [0],
                inline: true,
                menuItems: [
                    {
                        text: "<span class='mdi mdi-delete'></span> Remove",
                        action: (editor, _event) => {
                            if (confirm("Are you sure?")) {
                                const tr = editor.event.target.closest("tr");
                                editor.removeRow(tr);
                            }
                        }
                    }
                ]
            });
        }

        // Handle popstate event
        window.addEventListener('popstate', (event) => {
            const panelId = location.hash.substring(1) || panels[0].id; // remove the leading '#'
            showPanel(panelId);
        });

        // Show the initial panel based on the current URL hash
        const initialPanelId = location.hash.substring(1) || panels[0].id;
        showPanel(initialPanelId);
    });
})();
