let currentLang = localStorage.getItem('language') || 'vi';
let listenersBound = false;

// Load file ngôn ngữ
async function loadTranslations(lang) {
  try {
    const res = await fetch(`../../public/locales/${lang}.json`);
    return await res.json();
  } catch (error) {
    console.error('Load translations failed:', error);
    return {};
  }
}

// Dịch text trên trang
function translatePage(translations) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });
  
  // Dịch placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      el.placeholder = translations[key];
    }
  });
}

// Khởi tạo hệ thống dịch
export async function initTranslate() {
  const translations = await loadTranslations(currentLang);
  translatePage(translations);
  updateLanguageLabel(currentLang);

  if (!listenersBound) {
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
          currentLang = lang;
          localStorage.setItem('language', lang);
          const newTranslations = await loadTranslations(lang);
          translatePage(newTranslations);
          updateLanguageLabel(lang);
        }
      });
    });
    listenersBound = true;
  }
}

// Cập nhật label và active state cho nút ngôn ngữ
function updateLanguageLabel(lang) {
  const langLabel = document.querySelector('.current-lang-label');
  const langOptions = document.querySelectorAll('.lang-option');
  
  // Cập nhật text label
  if (langLabel) {
    langLabel.textContent = lang === 'vi' ? 'Vietnamese' : 'English';
  }
  
  // Cập nhật active state
  langOptions.forEach(opt => {
    const optLang = opt.getAttribute('data-lang');
    if (optLang === lang) {
      opt.classList.add('is-active');
    } else {
      opt.classList.remove('is-active');
    }
  });
}