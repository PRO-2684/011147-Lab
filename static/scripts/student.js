(function() {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const log = console.log.bind(console, "[student.js]");
    
    const assertion = window.common.assertLoggedIn();
    window.addEventListener("DOMContentLoaded", async (event) => {
        if (!(await assertion)) return;
    })
})();
