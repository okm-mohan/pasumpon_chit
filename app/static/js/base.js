document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const openButton = document.getElementById("sidebarOpen");
    const closeButton = document.getElementById("sidebarClose");
    const overlay = document.getElementById("appOverlay");

    const openSidebar = () => body.classList.add("sidebar-open");
    const closeSidebar = () => body.classList.remove("sidebar-open");

    openButton?.addEventListener("click", openSidebar);
    closeButton?.addEventListener("click", closeSidebar);
    overlay?.addEventListener("click", closeSidebar);
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 992) closeSidebar();
    });
});
