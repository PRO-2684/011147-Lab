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
        window.dataTables = dataTables;

        function showPanel(panelId) {
            for (const panel of panels) {
                panel.toggleAttribute('data-active', panel.id === panelId);
            }
            for (const anchor of nav.children) {
                anchor.toggleAttribute('data-active', anchor.getAttribute('data-panel') === panelId);
            }
        }

        async function reloadTable(panel) {
            dataTables[panel.id]?.editor?.destroy();
            dataTables[panel.id]?.dataTable?.destroy();
            const pkLength = tableInfo[panel.id].pkLength;
            const table = panel.querySelector('table');
            const headings = [];
            for (const headingEl of table.querySelectorAll('thead>tr>th')) {
                headings.push(headingEl.textContent);
            }
            const data = await window.common.postWithToken(`/api/table/get`, {
                table: panel.id,
            });
            const dataTable = new DataTable(table, {
                data: {
                    headings: headings,
                    data: data.data,
                }
            });
            const editor = makeEditable(dataTable, {
                contextMenu: true,
                hiddenColumns: true,
                excludeColumns: Array.from({ length: pkLength }, (_, i) => i),
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
                    const r = await window.common.postWithToken(`/api/table/update`, {
                        table: panel.id,
                        pkValues,
                        colIdx,
                        newValue,
                    });
                    if (!r.success) {
                        log(`Failed to update cell (${rowIdx}, ${colIdx})!`);
                        dataTable.data.data[rowIdx].cells[colIdx].data[0].data = before;
                        dataTable.refresh();
                    } else {
                        log(`Cell (${rowIdx}, ${colIdx}) updated!`);
                    }
                }
            });
            log(`Table "${panel.id}" (re)loaded!`);
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
        const btn = $("#op-refresh");
        btn.addEventListener('click', onRefresh);
    });
})();
