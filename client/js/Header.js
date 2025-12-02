import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";
import { checkAndShowLoginPopup } from "./AutoLoginPopup.js";

const CHECK_INTERVAL_MS = 10000; 

// Function to check if token is expired
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    if (decoded.exp && decoded.exp < now) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
}

// Function to handle token expiration
function handleTokenExpiration() {

  // Set flag for AutoLoginPopup to know token has expired
  sessionStorage.setItem("tokenExpired", "true");

  // Clear all user information
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("refreshToken");

  // Get current path
  const currentPath = window.location.pathname;
  const isHomePage = currentPath.includes("HomePage.html");

  // Always redirect to HomePage
  window.location.href = "/client/view/pages/HomePage.html";

  // If on HomePage → reload and show popup
  if (isHomePage) {
    window.location.reload();
  }
}

// Function to periodically check token expiration
function startTokenExpirationCheck() {

  const checkInterval = setInterval(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (isTokenExpired(accessToken)) {
      clearInterval(checkInterval);
      handleTokenExpiration();
    } else {
      try {
        const decoded = jwtDecode(accessToken);
        const now = Date.now() / 1000;
        const timeLeft = Math.floor(decoded.exp - now);
      } catch (error) {
        console.error("Error checking token:", error);
      }
    }
  }, CHECK_INTERVAL_MS);

  window.addEventListener("beforeunload", () => clearInterval(checkInterval));
  return checkInterval;
}

// Function to check token on page load
function checkTokenOnPageLoad() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken && isTokenExpired(accessToken)) {
    handleTokenExpiration();
    return false;
  }

  return true;
}

// Function to save selected language
function saveLanguagePreference(lang) {
  localStorage.setItem("selectedLanguage", lang);
}

// Function to load selected language
function loadLanguagePreference() {
  return localStorage.getItem("selectedLanguage");
}

// Function to update UI based on saved language
function applyLanguagePreference(languageSwitchers) {
  const savedLang = loadLanguagePreference();

  languageSwitchers.forEach((switcher) => {
    const allOptions = switcher.querySelectorAll(".lang-option");
    const currentFlag = switcher.querySelector(".current-flag");

    // Remove active from all options
    allOptions.forEach((o) => o.classList.remove("is-active"));

    // Add active to the matching option
    const matchingOption = Array.from(allOptions).find(
      (o) => o.getAttribute("data-lang") === savedLang
    );

    if (matchingOption) {
      matchingOption.classList.add("is-active");

      // Update current flag from option
      if (currentFlag) {
        const optionFlag = matchingOption.querySelector(".flag-icon");
        if (optionFlag) {
          currentFlag.src = optionFlag.src;
          currentFlag.alt = savedLang === "vi" ? "VN" : "UK";
          currentFlag.setAttribute("data-lang", savedLang);
        }
      }
    }
  });
}

// Function to check authentication status
function checkAuthStatus() {
  const accessToken = localStorage.getItem("accessToken");
  const guest = document.getElementById("user_guest");
  const logged = document.getElementById("main_user");

  if (accessToken && guest && logged) {
    guest.classList.add("hidden");
    logged.classList.remove("hidden");
    loadUserInfo();
    checkAdminRole();
  } else {
    if (guest) guest.classList.remove("hidden");
    if (logged) logged.classList.add("hidden");
    removeAdminMenu();
  }
}

// Function to load user information
function loadUserInfo() {
  const userName = document.querySelector(".user-name span");
  if (userName) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const payloadDecoded = jwtDecode(accessToken);
        // console.log("User info:", payloadDecoded);
        userName.textContent = payloadDecoded.username || "User";
      } else {
        userName.textContent = "User";
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      userName.textContent = "User";
    }
  }
}

// Function to remove Admin menu
function removeAdminMenu() {
  const existingAdminMenu = document.getElementById("admin-menu-item");
  if (existingAdminMenu) existingAdminMenu.remove();

  const existingSeparator = document.getElementById("admin-menu-separator");
  if (existingSeparator) existingSeparator.remove();
}

// Function to create dynamic Admin menu
function createAdminMenu() {
  removeAdminMenu();

  const dropdownList = document.querySelector(
    ".user-dropdown-menu .dropdown-list"
  );
  if (!dropdownList) {
    console.error("Dropdown list not found");
    return;
  }

  const logoutBtn = document.getElementById("Log-out-Btn");
  if (!logoutBtn) {
    console.error("Logout button not found");
    return;
  }

  const adminMenuItem = document.createElement("a");
  adminMenuItem.id = "admin-menu-item";
  adminMenuItem.className = "dropdown-item";
  adminMenuItem.href = "/client/view/pages/AdminUsers.html";
  adminMenuItem.innerHTML = `
    <div class="line-center">
      <i class="fa-solid fa-users-gear"></i>
      <span>Quản lý</span>
    </div>
  `;

  const separator = document.createElement("hr");
  separator.id = "admin-menu-separator";

  dropdownList.appendChild(separator);
  dropdownList.appendChild(adminMenuItem);
}

// Function to check Admin role
function checkAdminRole() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    try {
      const payloadDecoded = jwtDecode(accessToken);

      if (payloadDecoded.role === "Admin") {
        createAdminMenu();
      } else {
        removeAdminMenu();
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      removeAdminMenu();
    }
  } else {
    removeAdminMenu();
  }
}

// Function to close all dropdowns
function closeAllDropdowns() {
  // Close language switchers
  document.querySelectorAll(".language-switcher").forEach((switcher) => {
    switcher.classList.remove("open");
    switcher
      .querySelector(".swap-language")
      ?.setAttribute("aria-expanded", "false");
  });

  // Close user dropdown
  document
    .querySelector(".user-dropdown-menu .dropdown-list")
    ?.classList.remove("show");

  // Close country dropdown
  document
    .querySelector(".menu-film-type.dropdown")
    ?.classList.remove("toggled");
}

// Main function
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
  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu?.querySelector(".dropdown-list");

  // Check token on load
  if (!checkTokenOnPageLoad()) {
    checkAuthStatus();
    return;
  }

  // Start token check if token exists
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    startTokenExpirationCheck();
  }

  // Check and show popup if token expired
  checkAndShowLoginPopup();

  // Check authentication status
  checkAuthStatus();

  // Restore selected language immediately after initialization
  applyLanguagePreference(languageSwitchers);

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });

  // Handle language switcher for both buttons (mobile and desktop)
  languageSwitchers.forEach((languageSwitch) => {
    const langBtn = languageSwitch.querySelector(".swap-language");
    const langOptions = languageSwitch.querySelectorAll(".lang-option");

    // Open/close menu
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Get current state before toggle
      const wasOpen = languageSwitch.classList.contains("open");

      // Close ALL dropdowns first
      closeAllDropdowns();

      // If the menu was closed, open it; if it was open, keep it closed
      if (!wasOpen) {
        languageSwitch.classList.add("open");
        langBtn.setAttribute("aria-expanded", "true");
      }
    });

    langOptions.forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const selectedLang = opt.getAttribute("data-lang");
        const selectedFlagSrc = opt.querySelector(".flag-icon").src;

        // Save selected language to localStorage
        saveLanguagePreference(selectedLang);

        // Update all language switchers (mobile + desktop)
        languageSwitchers.forEach((switcher) => {
          const allOptions = switcher.querySelectorAll(".lang-option");
          const currentFlag = switcher.querySelector(".current-flag");

          // Remove active from all options
          allOptions.forEach((o) => o.classList.remove("is-active"));

          // Add active to the corresponding option
          const matchingOption = Array.from(allOptions).find(
            (o) => o.getAttribute("data-lang") === selectedLang
          );
          if (matchingOption) {
            matchingOption.classList.add("is-active");
          }

          // Update current flag
          if (currentFlag) {
            currentFlag.src = selectedFlagSrc;
            currentFlag.alt = selectedLang === "vi" ? "VN" : "UK";
            currentFlag.setAttribute("data-lang", selectedLang);
          }

          // Close menu
          switcher.classList.remove("open");
          switcher
            .querySelector(".swap-language")
            .setAttribute("aria-expanded", "false");
        });
      });
    });
  });

  searchNav.addEventListener("click", () => {
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
    languageSwitchers.forEach((ls) => ls.classList.toggle("hidden"));
  });

  // Country dropdown
  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Take current state
      const wasOpen = dropdown.classList.contains("toggled");

      // Close ALL dropdowns first
      closeAllDropdowns();

      // Toggle this dropdown
      if (!wasOpen) {
        dropdown.classList.add("toggled");
      }
    });
  }

  // User dropdown menu
  if (userDropdownMenu && dropdownList) {
    userDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();

      // Take current state
      const wasOpen = dropdownList.classList.contains("show");

      // Close ALL dropdowns first
      closeAllDropdowns();

      // Toggle this dropdown
      if (!wasOpen) {
        dropdownList.classList.add("show");
      }
    });
  }

  // Click outside to close ALL dropdowns
  document.addEventListener("click", (e) => {
    // Check if click is not on any dropdown
    const isLanguageSwitcher = Array.from(languageSwitchers).some((ls) =>
      ls.contains(e.target)
    );
    const isUserDropdown = userDropdownMenu?.contains(e.target);
    const isCountryDropdown = dropdown?.contains(e.target);

    if (!isLanguageSwitcher && !isUserDropdown && !isCountryDropdown) {
      closeAllDropdowns();
    }
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Popup modal
  const memberBtn = document.querySelector("#btn-member");
  if (memberBtn) {
    memberBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        console.log("User đã đăng nhập, không mở modal");
        return;
      }

      let modal = document.querySelector(".modal");
      if (!modal) {
        const html = await (
          await fetch("/client/view/components/AuthModal.html")
        ).text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        document.body.appendChild(doc.querySelector(".modal"));

        doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          const href = link.href;
          if (!document.querySelector(`link[href="${href}"]`)) {
            const newLink = Object.assign(document.createElement("link"), {
              rel: "stylesheet",
              href: href.startsWith("http")
                ? href
                : `/client${href.startsWith("/") ? "" : "/"}${href}`,
            });
            document.head.appendChild(newLink);
          }
        });

        // Reinitialize translation system for modal
        const { initTranslate } = await import("./Translate.js");
        await initTranslate();

        const { Auth_Modaljs } = await import("./AuthModal.js");
        Auth_Modaljs();
        setTimeout(() => window.openLRFModal("login"), 50);
      } else {
        window.openLRFModal("login");
      }
    });
  }

  document.addEventListener("userLoggedIn", (e) => {
    console.log("User logged in event triggered");
    checkAuthStatus();
  });

  // Logout button
  const logOutBtn = document.querySelector("#Log-out-Btn");
  if (logOutBtn) {
    logOutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      console.log("Logging out user");

      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          console.log("Current user:", jwtDecode(token));
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");

      checkAuthStatus();
      window.location.href = "/client/view/pages/HomePage.html";
    });
  }
}
