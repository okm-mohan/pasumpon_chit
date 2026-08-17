(() => {
  const shell = document.querySelector('.community-shell');
  const sidebar = document.getElementById('communitySidebar');
  const toggle = document.querySelector('.menu-toggle');
  if (!shell || !sidebar || !toggle) return;
  toggle.addEventListener('click', () => {
    if (window.innerWidth <= 840) sidebar.classList.toggle('open');
    else shell.classList.toggle('sidebar-off');
  });
  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 840 && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !toggle.contains(event.target)) sidebar.classList.remove('open');
  });
})();