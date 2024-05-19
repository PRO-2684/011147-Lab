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
        if (!(await assertion)) return;
        const panels = $("#panels").children;
        const nav = $('#nav');
        const dataTables = {};
        window.common.initNav(panels, nav);
        // Expose dataTables to `window` for debugging
        location.search.includes("debug=true") && (window.dataTables = dataTables);

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

        // Float buttons
        window.common.initFloatButtons(reloadTable);

        // Load the tables
        for (const panel of panels) {
            await reloadTable(panel);
        }
    });
})();
