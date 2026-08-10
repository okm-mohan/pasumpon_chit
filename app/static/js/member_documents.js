document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('documentModal');
  const viewer = document.getElementById('documentViewer');
  const title = document.getElementById('documentModalTitle');
  const description = document.getElementById('documentModalDescription');
  const type = document.getElementById('documentModalType');
  const download = document.getElementById('modalDownload');
  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); viewer.replaceChildren(); };
  document.querySelectorAll('.preview-document').forEach(button => button.addEventListener('click', () => {
    const url = button.dataset.url, isPdf = button.dataset.type === 'PDF' || url.toLowerCase().endsWith('.pdf');
    title.textContent = button.dataset.title; description.textContent = button.dataset.description; type.textContent = button.dataset.type; download.href = url;
    const element = isPdf ? Object.assign(document.createElement('iframe'), { src: url, title: button.dataset.title }) : Object.assign(document.createElement('img'), { src: url, alt: button.dataset.title });
    viewer.append(element); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  }));
  document.getElementById('closeDocument')?.addEventListener('click', close);
  modal?.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
});
