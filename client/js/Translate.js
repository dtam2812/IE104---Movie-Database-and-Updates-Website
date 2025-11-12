// Translate.js — i18n cho text + mọi thuộc tính data-i18n-*

let currentLang = localStorage.getItem('language') || 'vi';
let listenersBound = false;

// Nạp file ngôn ngữ
async function loadTranslations(lang) {
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    return await res.json();
  } catch (error) {
    console.error('Load translations failed:', error);
    return {};
  }
}

// Áp bản dịch cho text và các thuộc tính có prefix data-i18n-
function translatePage(translations) {
  // text node
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] !== undefined) el.textContent = translations[key];
  });

  // thuộc tính bất kỳ: data-i18n-attrName="key"
  document.querySelectorAll('*').forEach(el => {
    for (const attr of el.attributes) {
      if (!attr.name.startsWith('data-i18n-') || attr.name === 'data-i18n') continue;
      const targetAttr = attr.name.replace('data-i18n-', '');
      const key = attr.value;
      const val = translations[key];
      if (val !== undefined) el.setAttribute(targetAttr, val);
    }
  });
}

// Cập nhật label và trạng thái nút ngôn ngữ
function updateLanguageLabel(lang) {
  const langLabel = document.querySelector('.current-lang-label');
  const langOptions = document.querySelectorAll('.lang-option');
  if (langLabel) langLabel.textContent = lang === 'vi' ? 'Vietnamese' : 'English';
  langOptions.forEach(opt => {
    const optLang = opt.getAttribute('data-lang');
    opt.classList.toggle('is-active', optLang === lang);
  });
}

// Khởi tạo
export async function initTranslate() {
  document.documentElement.lang = currentLang;
  const translations = await loadTranslations(currentLang);
  translatePage(translations);
  updateLanguageLabel(currentLang);

  if (!listenersBound) {
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        if (!lang || lang === currentLang) return;

        currentLang = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;

        const newTranslations = await loadTranslations(lang);
        translatePage(newTranslations);
        updateLanguageLabel(lang);

        // báo cho các module động (hero, grid...) tự nạp lại theo lang
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
      });
    });
    listenersBound = true;
  }
}
