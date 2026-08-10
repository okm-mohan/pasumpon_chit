document.addEventListener('DOMContentLoaded', () => {
  const detail = document.getElementById('calendarDetail');
  const date = document.getElementById('detailDate');
  const title = document.getElementById('detailTitle');
  const subtitle = document.getElementById('detailSubtitle');
  const amount = document.getElementById('detailAmount');
  const eventBox = document.getElementById('detailEvent');
  const result = document.getElementById('reminderResult');
  const selectDay = (day) => {
    document.querySelectorAll('.calendar-day.selected').forEach(item => item.classList.remove('selected'));
    day.classList.add('selected');
    date.textContent = day.dataset.dateLabel;
    title.textContent = day.dataset.title;
    subtitle.textContent = day.dataset.subtitle;
    amount.textContent = Number(day.dataset.amount || 0) ? `₹${Number(day.dataset.amount).toLocaleString('en-IN')}` : '—';
    eventBox.className = `detail-event detail-${day.dataset.kind || 'none'}`;
    detail.classList.add('open');
    result.textContent = '';
  };
  document.querySelectorAll('.calendar-day').forEach(day => day.addEventListener('click', () => selectDay(day)));
  document.querySelectorAll('[data-select-date]').forEach(button => button.addEventListener('click', () => {
    const target = document.querySelector(`.calendar-day[data-date="${button.dataset.selectDate}"]`);
    if (target) selectDay(target);
  }));
  document.querySelector('.detail-close')?.addEventListener('click', () => detail.classList.remove('open'));
  const confirmReminder = async (label) => {
    const eventDate = document.querySelector('.calendar-day.selected')?.dataset.date || new Date().toISOString().slice(0, 10);
    const formData = new FormData(); formData.append('event_date', eventDate); formData.append('title', label);
    try {
      const response = await fetch('/member/calendar/reminder', { method: 'POST', body: formData });
      const data = await response.json(); result.textContent = data.message || `${label} நினைவூட்டல் அமைக்கப்பட்டது.`;
    } catch (_) { result.textContent = `${label} நினைவூட்டல் அமைக்கப்பட்டது.`; }
    detail.classList.add('open');
  };
  document.getElementById('reminderButton')?.addEventListener('click', () => confirmReminder(title.textContent));
  document.querySelectorAll('[data-reminder],#footerReminder').forEach(button => {
    const action = () => confirmReminder(button.dataset.reminder || 'தவணை செலுத்துதல்');
    button.addEventListener('click', action);
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); } });
  });
  document.getElementById('downloadCalendar')?.addEventListener('click', () => window.print());
});
