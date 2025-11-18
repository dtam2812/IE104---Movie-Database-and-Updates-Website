import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";
import { checkAndShowLoginPopup } from "./AutoLoginPopup.js";

const CHECK_INTERVAL_MS = 10000; // 10 giây

// Hàm kiểm tra token có hết hạn chưa
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    if (decoded.exp && decoded.exp < now) {
      console.log("Token đã hết hạn!");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
}

// Hàm xử lý khi token hết hạn
function handleTokenExpiration() {
  console.log("Token hết hạn - Đang xử lý logout...");

  // Set flag để AutoLoginPopup biết là token đã hết hạn
  sessionStorage.setItem("tokenExpired", "true");

  // Xóa tất cả thông tin user
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("refreshToken");

  // Lấy đường dẫn hiện tại
  const currentPath = window.location.pathname;
  const isHomePage = currentPath.includes("HomePage.html");

  // Luôn redirect về HomePage
  window.location.href = "/client/view/pages/HomePage.html";

  // Nếu đang ở HomePage → reload và mở popup
  if (isHomePage) {
    window.location.reload();
  }
}

// Hàm kiểm tra token định kỳ
function startTokenExpirationCheck() {
  console.log(
    `Bắt đầu kiểm tra token expiration mỗi ${CHECK_INTERVAL_MS / 1000} giây...`
  );

  const checkInterval = setInterval(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (isTokenExpired(accessToken)) {
      console.log("Token đã hết hạn!");
      clearInterval(checkInterval);
      handleTokenExpiration();
    } else {
      try {
        const decoded = jwtDecode(accessToken);
        const now = Date.now() / 1000;
        const timeLeft = Math.floor(decoded.exp - now);
        console.log(`Token còn ${timeLeft} giây`);
      } catch (error) {
        console.error("Error checking token:", error);
      }
    }
  }, CHECK_INTERVAL_MS);

  window.addEventListener("beforeunload", () => clearInterval(checkInterval));
  return checkInterval;
}

// Hàm kiểm tra token khi vừa load trang
function checkTokenOnPageLoad() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken && isTokenExpired(accessToken)) {
    console.log("Token đã hết hạn khi load trang");
    handleTokenExpiration();
    return false;
  }

  return true;
}

// Hàm lưu ngôn ngữ đã chọn
function saveLanguagePreference(lang) {
  localStorage.setItem("selectedLanguage", lang);
}

// Hàm load ngôn ngữ đã chọn
function loadLanguagePreference() {
  return localStorage.getItem("selectedLanguage");
}

// Hàm cập nhật UI theo ngôn ngữ đã lưu
function applyLanguagePreference(languageSwitchers) {
  const savedLang = loadLanguagePreference();

  languageSwitchers.forEach((switcher) => {
    const allOptions = switcher.querySelectorAll(".lang-option");
    const currentFlag = switcher.querySelector(".current-flag");

    // Xóa active khỏi tất cả options
    allOptions.forEach((o) => o.classList.remove("is-active"));

    // Thêm active vào option tương ứng
    const matchingOption = Array.from(allOptions).find(
      (o) => o.getAttribute("data-lang") === savedLang
    );

    if (matchingOption) {
      matchingOption.classList.add("is-active");

      // Cập nhật cờ hiện tại từ option
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

// Hàm kiểm tra trạng thái đăng nhập
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

// Hàm load thông tin user
function loadUserInfo() {
  const userName = document.querySelector(".user-name span");
  if (userName) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const payloadDecoded = jwtDecode(accessToken);
        console.log("User info:", payloadDecoded);
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

// Hàm xóa menu Admin
function removeAdminMenu() {
  const existingAdminMenu = document.getElementById("admin-menu-item");
  if (existingAdminMenu) existingAdminMenu.remove();

  const existingSeparator = document.getElementById("admin-menu-separator");
  if (existingSeparator) existingSeparator.remove();
}

// Hàm tạo menu Admin động
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

// Hàm kiểm tra role Admin
function checkAdminRole() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    try {
      const payloadDecoded = jwtDecode(accessToken);
      console.log("Checking admin role:", payloadDecoded.role);

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

  // Check token on load
  if (!checkTokenOnPageLoad()) {
    checkAuthStatus();
    return;
  }

  // Start token check nếu có token
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    startTokenExpirationCheck();
  }

  // Check và show popup nếu token expired
  checkAndShowLoginPopup();

  // Kiểm tra trạng thái đăng nhập
  checkAuthStatus();

  // Khôi phục ngôn ngữ đã chọn ngay sau khi khởi tạo
  applyLanguagePreference(languageSwitchers);

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });

  // Xử lý language switcher cho cả 2 nút (mobile và desktop)
  languageSwitchers.forEach((languageSwitch) => {
    const langBtn = languageSwitch.querySelector(".swap-language");
    const langOptions = languageSwitch.querySelectorAll(".lang-option");

    // Mở/đóng menu
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Lấy trạng thái hiện tại trước khi toggle
      const wasOpen = languageSwitch.classList.contains("open");

      // Đóng tất cả language switchers trước
      languageSwitchers.forEach((switcher) => {
        switcher.classList.remove("open");
        switcher
          .querySelector(".swap-language")
          .setAttribute("aria-expanded", "false");
      });

      // Nếu menu đang đóng thì mở nó, nếu đang mở thì giữ đóng
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

        // Lưu ngôn ngữ đã chọn vào localStorage
        saveLanguagePreference(selectedLang);

        // Cập nhật tất cả language switchers (mobile + desktop)
        languageSwitchers.forEach((switcher) => {
          const allOptions = switcher.querySelectorAll(".lang-option");
          const currentFlag = switcher.querySelector(".current-flag");

          // Xóa active khỏi tất cả options
          allOptions.forEach((o) => o.classList.remove("is-active"));

          // Thêm active vào option tương ứng
          const matchingOption = Array.from(allOptions).find(
            (o) => o.getAttribute("data-lang") === selectedLang
          );
          if (matchingOption) {
            matchingOption.classList.add("is-active");
          }

          // Cập nhật cờ hiện tại
          if (currentFlag) {
            currentFlag.src = selectedFlagSrc;
            currentFlag.alt = selectedLang === "vi" ? "VN" : "UK";
            currentFlag.setAttribute("data-lang", selectedLang);
          }

          // Đóng menu
          switcher.classList.remove("open");
          switcher
            .querySelector(".swap-language")
            .setAttribute("aria-expanded", "false");
        });
      });
    });
  });

  // Click ngoài để đóng tất cả language switchers
  document.addEventListener("click", (e) => {
    languageSwitchers.forEach((languageSwitch) => {
      if (
        !languageSwitch.contains(e.target) &&
        languageSwitch.classList.contains("open")
      ) {
        languageSwitch.classList.remove("open");
        languageSwitch
          .querySelector(".swap-language")
          .setAttribute("aria-expanded", "false");
      }
    });
  });

  searchNav.addEventListener("click", () => {
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
    languageSwitchers.forEach((ls) => ls.classList.toggle("hidden"));
  });

  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", () => {
      dropdown.classList.toggle("toggled");
    });
  }

  document.addEventListener("click", (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove("toggled");
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

        // Khởi tạo lại hệ thống dịch cho modal
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

  // User dropdown menu
  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu?.querySelector(".dropdown-list");

  if (userDropdownMenu && dropdownList) {
    userDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownList.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!userDropdownMenu.contains(e.target)) {
        dropdownList.classList.remove("show");
      }
    });
  }

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
