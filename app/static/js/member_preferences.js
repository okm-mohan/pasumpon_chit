(() => {
  const english = {
    'எனது பகுதி': 'My space', 'எனது Dashboard': 'My Dashboard', 'எனது Inbox': 'My Inbox', 'எனது நிலை': 'My Status',
    'அறிவிப்புகள்': 'Announcements', 'ஆவணங்கள்': 'Documents', 'உதவி & ஆதரவு': 'Help & Support', 'சமூகம்': 'Community',
    'எனது சுயவிவரம்': 'My Profile', 'அமைப்புகள்': 'Settings', 'வெளியேறு': 'Logout', 'உறுப்பினர் விருப்பங்கள்': 'Member preferences',
    'உங்கள் Portal அமைப்புகள்': 'Your Portal settings', 'மாற்றங்கள் இந்த சாதனத்தில் உடனடியாகச் சேமிக்கப்படும்.': 'Changes are saved immediately on this device.',
    'அறிவிப்பு நினைவூட்டல்கள்': 'Notification reminders', 'பணம், நிலுவை மற்றும் முக்கிய தகவல்களுக்கான அறிவிப்புகள்': 'Payment, due and important-information notifications',
    'மொழி': 'Language', 'Portal மொழியைத் தேர்வு செய்யவும்': 'Choose your portal language',
    'கண்களுக்கு எளிய இருண்ட காட்சித் தோற்றம்': 'A comfortable dark display for your eyes', 'அமைப்புகளைச் சேமி': 'Save settings',
    'உங்கள் விருப்பங்கள் பாதுகாப்பாகச் சேமிக்கப்படும்.': 'Your preferences will be saved securely.', 'அமைப்புகள் சேமிக்கப்பட்டன.': 'Settings saved successfully.',
    'மொழி குறிப்பு': 'Language note', 'கணக்கு பாதுகாப்பாக உள்ளது': 'Your account is secure', 'தனிப்பட்ட அமைப்புகள்': 'Personal preferences',
    'உறுப்பினர் சேவைகள்': 'Member services', 'உறுப்பினர்': 'Member', 'செயலில் உள்ள உறுப்பினர்': 'Active member'
  };
  const tamil = Object.fromEntries(Object.entries(english).map(([ta, en]) => [en, ta]));
  function translate(language) {
    const dictionary = language === 'en' ? english : tamil;
    document.querySelectorAll('body *').forEach(element => {
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(element.tagName)) return;
      [...element.childNodes].forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const value = node.nodeValue.trim();
        if (dictionary[value]) node.nodeValue = node.nodeValue.replace(value, dictionary[value]);
      });
    });
    document.documentElement.lang = language;
  }
  window.memberPortalApplyLanguage = translate;
  const applyPreferences = () => {
    const language = localStorage.getItem('memberPortalLanguage') || 'ta';
    document.body.classList.toggle('member-dark-mode', localStorage.getItem('memberPortalDarkMode') === 'true');
    translate(language);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyPreferences);
  else applyPreferences();
})();
