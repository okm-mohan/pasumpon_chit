document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('announcementModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const category = document.getElementById('modalCategory');
  const date = document.getElementById('modalDate');
  const open = (notice) => { title.textContent = notice.dataset.title; body.textContent = notice.dataset.body; category.textContent = notice.dataset.category; date.textContent = notice.dataset.date; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); };
  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  document.querySelectorAll('.chalk-note').forEach(note => note.addEventListener('click', () => open(note)));
  document.getElementById('closeAnnouncement')?.addEventListener('click', close);
  modal?.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
});
