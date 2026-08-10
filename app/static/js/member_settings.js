document.addEventListener('DOMContentLoaded', () => {
  const language = document.getElementById('languageSetting');
  const darkMode = document.getElementById('darkModeSetting');
  const notifications = document.getElementById('notificationSetting');
  const save = document.getElementById('saveSettings');
  const result = document.getElementById('settingsResult');
  if (!language || !darkMode || !notifications || !save) return;

  language.value = localStorage.getItem('memberPortalLanguage') || 'ta';
  darkMode.checked = localStorage.getItem('memberPortalDarkMode') === 'true';
  notifications.checked = localStorage.getItem('memberPortalNotifications') !== 'false';
  document.documentElement.lang = language.value;

  darkMode.addEventListener('change', () => document.body.classList.toggle('member-dark-mode', darkMode.checked));
  language.addEventListener('change', () => window.memberPortalApplyLanguage?.(language.value));
  save.addEventListener('click', () => {
    localStorage.setItem('memberPortalLanguage', language.value);
    localStorage.setItem('memberPortalDarkMode', String(darkMode.checked));
    localStorage.setItem('memberPortalNotifications', String(notifications.checked));
    document.body.classList.toggle('member-dark-mode', darkMode.checked);
    window.memberPortalApplyLanguage?.(language.value);
    result.innerHTML = '<i class="bi bi-check-circle-fill"></i> அமைப்புகள் சேமிக்கப்பட்டன.';
    result.classList.add('saved');
  });
});
