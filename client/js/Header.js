import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

// Hàm kiểm tra trạng thái đăng nhập
function checkAuthStatus() {
  const accessToken = localStorage.getItem("accessToken");
  const guest = document.getElementById("user_guest");
  const logged = document.getElementById("main_user");

  if (accessToken && guest && logged) {
    guest.classList.add("hidden");
    logged.classList.remove("hidden");
    loadUserInfo();
  } else {
    if (guest) guest.classList.remove("hidden");
    if (logged) logged.classList.add("hidden");
  }
}

// Load thông tin user
function loadUserInfo() {
  const userName = document.querySelector(".user-name span");
  if (userName && localStorage.accessToken) {
    try {
      const payload = jwtDecode(localStorage.accessToken);
      userName.textContent = payload.username || "User";
    } catch {
      userName.textContent = "User";
    }
  }
}

// Lưu + dispatch khi đổi ngôn ngữ (dùng chung key "language")
function saveLanguagePreference(lang) {
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

function loadLanguagePreference() {
  return localStorage.getItem("language") || "vi";
}

function applyLanguagePreference(languageSwitchers) {
  const savedLang = loadLanguagePreference();

  languageSwitchers.forEach((switcher) => {
    const allOptions = switcher.querySelectorAll(".lang-option");
    const currentFlag = switcher.querySelector(".current-flag");

    allOptions.forEach((o) => o.classList.remove("is-active"));

    const activeOpt = Array.from(allOptions).find(
      (o) => o.dataset.lang === savedLang
    );
    if (activeOpt) {
      activeOpt.classList.add("is-active");
      if (currentFlag) {
        const flag = activeOpt.querySelector(".flag-icon");
        currentFlag.src = flag.src;
        currentFlag.alt = savedLang === "vi" ? "VN" : "UK";
        currentFlag.dataset.lang = savedLang;
      }
    }
  });

  document.documentElement.lang = savedLang;
}

export async function headerjs() {
  const { initTranslate } = await import("./Translate.js");
  await initTranslate();

  const menuToggle = document.querySelector(".menu-toggle");
  const searchGroup = document.querySelector(".search-group");
  const searchNav = document.querySelector(".search-toggle");
  const searchBox = document.querySelector(".search");
  const logo = document.querySelector(".header-logo");
  const dropdown = document.querySelector(".menu-film-type.dropdown");
  const dropdownBtn = document.querySelector(".dropdown-toggle");
  const languageSwitchers = document.querySelectorAll(".language-switcher");

  checkAuthStatus();
  applyLanguagePreference(languageSwitchers);

  menuToggle?.addEventListener("click", () => {
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });

  languageSwitchers.forEach((switcher) => {
    const btn = switcher.querySelector(".swap-language");
    const options = switcher.querySelectorAll(".lang-option");

    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      languageSwitchers.forEach((s) => s.classList.remove("open"));
      switcher.classList.toggle("open");
    });

    options.forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const lang = opt.dataset.lang;
        const flagSrc = opt.querySelector(".flag-icon").src;

        saveLanguagePreference(lang);

        languageSwitchers.forEach((s) => {
          s.querySelectorAll(".lang-option").forEach((o) =>
            o.classList.remove("is-active")
          );
          const match = s.querySelector(`.lang-option[data-lang="${lang}"]`);
          if (match) match.classList.add("is-active");

          const flag = s.querySelector(".current-flag");
          if (flag) {
            flag.src = flagSrc;
            flag.alt = lang === "vi" ? "VN" : "UK";
          }

          s.classList.remove("open");
        });
      });
    });
  });

  document.addEventListener("click", (e) => {
    languageSwitchers.forEach((s) => {
      if (!s.contains(e.target) && s.classList.contains("open")) {
        s.classList.remove("open");
      }
    });
  });

  searchNav?.addEventListener("click", () => {
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
    languageSwitchers.forEach((ls) => ls.classList.toggle("hidden"));
  });

  dropdownBtn?.addEventListener("click", () =>
    dropdown.classList.toggle("toggled")
  );

  document.addEventListener("click", (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove("toggled");
    }
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  });

  // Phần modal đăng nhập, modal, logout… giữ nguyên như code của anh
  // (em không paste lại để ngắn, anh copy nguyên phần dưới của file cũ vào đây là được)
}
