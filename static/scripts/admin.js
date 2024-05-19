(async function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[admin.js]");
    const { DataTable, makeEditable } = window.simpleDatatables;
    const tableInfo = {
        "major": {
            "pkLength": 1,
            "dataTypes": [Number, String, String]
        },
        "class": {
            "pkLength": 1,
            "dataTypes": [Number, String, String, Number]
        },
        "student": {
            "pkLength": 1,
            "dataTypes": [String, String, String, Number, String, String, Number]
        },
        "course": {
            "pkLength": 1,
            "dataTypes": [Number, String, String, String, String, Number, Number]
        },
        "score": {
            "pkLength": 2,
            "dataTypes": [String, Number, Number]
        },
    };

    const assertion = window.common.assertLoggedIn();
    window.addEventListener('DOMContentLoaded', async (event) => {
        await assertion;
        const panels = $("#panels").children;
        const nav = $('#nav');
        const dataTables = {};
        // Expose dataTables to the global scope for debugging
        location.search.includes("debug=true") && (window.dataTables = dataTables);

        function showPanel(panelId) {
            for (const panel of panels) {
                panel.toggleAttribute('data-active', panel.id === panelId);
            }
            for (const anchor of nav.children) {
                anchor.toggleAttribute('data-active', anchor.getAttribute('data-panel') === panelId);
            }
        }

        async function reloadTable(panel) {
            initTable(panel);
            const dataTable = dataTables[panel.id].dataTable;
            dataTable.setMessage("Loading...");
            dataTable.wrapperDOM.toggleAttribute('data-busy', true);
            const data = await window.common.postWithToken(`/api/admin/get`, {
                table: panel.id,
            });
            dataTable.data.data = [];
            dataTable.insert({ data: data.data });
            dataTable.wrapperDOM.toggleAttribute('data-busy', false);
            log(`Reloaded table "${panel.id}".`);
        }

        function initTable(panel) {
            if (dataTables[panel.id]) {
                return;
            }
            const pkLength = tableInfo[panel.id].pkLength;
            const table = panel.querySelector('table');
            const dataTable = new DataTable(table);
            const editor = makeEditable(dataTable, {
                contextMenu: true,
                hiddenColumns: true,
                excludeColumns: Array.from({ length: pkLength }, (_, i) => i),
                inline: true,
                menuItems: [
                    {
                        text: "Duplicate", // Duplicate row (copy content to "Insert" form)
                        action: (editor, _event) => {
                            editor.closeMenu();
                            const tr = editor.event.target.closest("tr");
                            const cells = tr.querySelectorAll("td");
                            const form = panel.querySelector("form");
                            // Select inputs that type is not "hidden"
                            const inputs = form.querySelectorAll("input:not([type='hidden'])");
                            for (let i = 0; i < cells.length; i++) {
                                inputs[i].value = cells[i].textContent;
                            }
                            inputs[0].focus();
                            inputs[0].scrollIntoView();
                        }
                    },
                    {
                        text: "Remove", // Remove row
                        action: async (editor, _event) => {
                            editor.closeMenu();
                            if (confirm("Are you sure?")) {
                                const tr = editor.event.target.closest("tr");
                                const pkValues = [];
                                for (let i = 0; i < pkLength; i++) {
                                    const cell = tr.children[i];
                                    const isEditing = Boolean(cell.querySelector("input"));
                                    if (isEditing) {
                                        alert("Cannot remove a row that is being edited!");
                                        return;
                                    }
                                    const dataType = tableInfo[panel.id].dataTypes[i];
                                    const cellValue = dataType(cell.textContent);
                                    pkValues.push(cellValue);
                                }
                                log(`Removing row with pkValues:`, pkValues);
                                panel.toggleAttribute('data-busy', true);
                                const r = await window.common.postWithToken(`/api/admin/delete`, {
                                    table: panel.id,
                                    pkValues,
                                });
                                panel.toggleAttribute('data-busy', false);
                                if (!r.success) {
                                    const error = `Failed to remove row on table "${panel.id}": ${r.error}`;
                                    log(error);
                                    alert(error);
                                } else {
                                    log("Row removed!");
                                    editor.removeRow(tr);
                                }
                            }
                        }
                    }
                ]
            });
            dataTables[panel.id] = { dataTable, editor };
            dataTable.on("editable.save.cell", async (after, before, rowIdx, colIdx) => {
                if (after !== before) {
                    const row = dataTable.data.data[rowIdx].cells;
                    const pkValues = [];
                    for (let i = 0; i < pkLength; i++) {
                        const cell = row[i];
                        const dataType = tableInfo[panel.id].dataTypes[i];
                        const cellValue = dataType(cell.data[0].data);
                        pkValues.push(cellValue);
                    }
                    const newValueDataType = tableInfo[panel.id].dataTypes[colIdx];
                    const newValue = newValueDataType(after);
                    log(`Cell (${rowIdx}, ${colIdx}) changed from "${before}" to "${after}"`, pkValues, colIdx, newValue);
                    panel.toggleAttribute('data-busy', true);
                    const r = await window.common.postWithToken(`/api/admin/update`, {
                        table: panel.id,
                        pkValues,
                        colIdx,
                        newValue,
                    });
                    panel.toggleAttribute('data-busy', false);
                    if (!r.success) {
                        log(`Failed to update cell (${rowIdx}, ${colIdx})!`);
                        dataTable.data.data[rowIdx].cells[colIdx].data[0].data = before;
                        dataTable.refresh();
                    } else {
                        log(`Cell (${rowIdx}, ${colIdx}) updated!`);
                    }
                }
            });
            // Insert form
            async function onInsert(e) {
                e.preventDefault();
                panel.toggleAttribute('data-busy', true);
                const respData = await window.common.submit(e, true);
                panel.toggleAttribute('data-busy', false);
                if (respData.success) {
                    log(`Inserted a new row into table "${panel.id}"!`);
                    reloadTable(panel);
                } else {
                    const error = `Failed to insert a new row into table "${panel.id}": ${respData.error}`;
                    log(error);
                    alert(error);
                }
            }
            panel.querySelector('form').addEventListener('submit', onInsert);
            log(`Table "${panel.id}" initialized!`);
        }

        // Generate anchors
        for (const panel of panels) {
            const anchor = document.createElement('a');
            anchor.href = '#' + panel.id;
            anchor.setAttribute('data-panel', panel.id);
            anchor.textContent = panel.id.charAt(0).toUpperCase() + panel.id.slice(1);
            nav.appendChild(anchor);
        }

        // Handle popstate event
        window.addEventListener('popstate', (event) => {
            const panelId = location.hash.substring(1) || panels[0].id; // remove the leading '#'
            if (panelId === "top") return;
            showPanel(panelId);
        });

        // Show the initial panel based on the current URL hash
        const initialPanelId = location.hash.substring(1) || panels[0].id;
        showPanel(initialPanelId);

        // Load the tables
        for (const panel of panels) {
            await reloadTable(panel);
        }

        // Refresh button
        async function onRefresh(e) {
            const btn = e.target;
            const isDisabled = btn.hasAttribute('data-busy');
            if (isDisabled) return;
            const panelId = nav.querySelector('[data-active]').getAttribute('data-panel');
            btn.toggleAttribute('data-busy', true);
            await reloadTable($("#" + panelId));
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
    });
})();
