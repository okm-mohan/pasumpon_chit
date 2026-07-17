document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const openButton = document.getElementById("panduSidebarOpen");
    const closeButton = document.getElementById("panduSidebarClose");
    const overlay = document.getElementById("panduOverlay");
    const close = () => body.classList.remove("pandu-sidebar-open");
    openButton?.addEventListener("click", () => body.classList.add("pandu-sidebar-open"));
    closeButton?.addEventListener("click", close);
    overlay?.addEventListener("click", close);
    window.addEventListener("resize", () => { if (window.innerWidth >= 992) close(); });
});
