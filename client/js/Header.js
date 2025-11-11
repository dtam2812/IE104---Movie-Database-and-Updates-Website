import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

// Hàm kiểm tra trạng thái đăng nhập
function checkAuthStatus() {
  const accessToken = localStorage.getItem("accessToken");
  const guest = document.getElementById("user_guest");
  const logged = document.getElementById("main_user");

  if (accessToken && guest && logged) {
    // Đã đăng nhập - hiện user menu, ẩn button thành viên
    guest.classList.add("hidden");
    logged.classList.remove("hidden");

    // Load thông tin user
    loadUserInfo();
  } else {
    // Chưa đăng nhập - hiện button thành viên
    guest.classList.remove("hidden");
    logged.classList.add("hidden");
  }
}

// Hàm load thông tin user
function loadUserInfo() {
  // Cập nhật tên user trong dropdown
  const userName = document.querySelector(".user-name span");
  if (userName) {
    const payloadDecoded = jwtDecode(localStorage.accessToken);
    console.log(payloadDecoded);
    if (localStorage.accessToken) {
      userName.textContent = payloadDecoded.username;
    } else {
      userName.textContent = "User"; // Tên mặc định nếu không có
    }
  }
}

export async function headerjs() {
  // ========== KHỞI TẠO HỆ THỐNG DỊCH ==========
  const { initTranslate } = await import('./Translate.js');
  await initTranslate();
  const menuToggle = document.querySelector(".menu-toggle");
  const searchGroup = document.querySelector(".search-group");
  const searchNav = document.querySelector(".search-toggle");
  const searchBox = document.querySelector(".search");
  const logo = document.querySelector(".header-logo");
  const dropdown = document.querySelector(".menu-film-type.dropdown");
  const dropdownBtn = document.querySelector(".dropdown-toggle");
  const langRoot = document.querySelector(".language-switcher");

  // Kiểm tra trạng thái đăng nhập ngay khi load trang
  checkAuthStatus();

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });
  
  if (langRoot) {
    const langBtn = langRoot.querySelector(".swap-language");
    const langLabel = langRoot.querySelector(".current-lang-label");
    const langOptions = langRoot.querySelectorAll(".lang-option");

    // mở/đóng menu
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = langRoot.classList.toggle("open");
      langBtn.setAttribute("aria-expanded", String(open));
    });

    // chọn ngôn ngữ -> đổi nhãn và đánh dấu active
    langOptions.forEach((opt) => {
      opt.addEventListener("click", () => {
        langOptions.forEach(o => o.classList.remove("is-active"));
        opt.classList.add("is-active");
        langLabel.textContent = opt.textContent.trim();
        langRoot.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
      });
    });

    // click ngoài để đóng
    document.addEventListener("click", () => {
      if (langRoot.classList.contains("open")) {
        langRoot.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Esc để đóng
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        langRoot.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
  
  searchNav.addEventListener("click", () => {
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
  });

  dropdownBtn.addEventListener("click", () => {
    dropdown.classList.toggle("toggled");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
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

  // Popup modal - chỉ cho phép khi chưa đăng nhập
  const memberBtn = document.querySelector("#btn-member");
  if (memberBtn) {
    memberBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Kiểm tra đã đăng nhập chưa
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        // Đã đăng nhập rồi thì không mở modal
        return;
      }

      let modal = document.querySelector(".modal");
      if (!modal) {
        // Load file AuthModal.html vào header.html
        const html = await (
          await fetch("../../view/components/AuthModal.html")
        ).text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        document.body.appendChild(doc.querySelector(".modal"));

        doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          const href = link.href;
          if (!document.querySelector(`link[href="${href}"]`)) {
            document.head.appendChild(
              Object.assign(document.createElement("link"), {
                rel: "stylesheet",
                href,
              })
            );
          }
        });

        // Import file AuthModal.js vào
        const { Auth_Modaljs } = await import("./AuthModal.js");
        Auth_Modaljs();
        setTimeout(() => window.openLRFModal("login"), 50);
      } else {
        window.openLRFModal("login");
      }
    });
  }

  // Xử lý sự kiện sau khi user đăng nhập vào
  document.addEventListener("userLoggedIn", (e) => {
    const guest = document.getElementById("user_guest");
    const logged = document.getElementById("main_user");

    if (guest && logged) {
      guest.classList.add("hidden");
      logged.classList.remove("hidden");
    }

    // Load thông tin user sau khi đăng nhập
    loadUserInfo();
  });

  // Xử lý sự kiện khi click vào main user ở header
  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu?.querySelector(".dropdown-list");

  if (userDropdownMenu && dropdownList) {
    userDropdownMenu.addEventListener("click", (e) => {
      dropdownList.classList.toggle("show");
    });

  const logOutBtn = dropdownList.querySelector("#Log-out-Btn");
    // Tắt user-dropdown-menu khi click ở bên ngoài menu
    document.addEventListener("click", (e) => {
      if (!userDropdownMenu.contains(e.target)) {
        dropdownList.classList.remove("show");
      }
    });
  }

  // Xử lý sự kiện đăng xuất
  const logOutBtn = document.querySelector("#Log-out-Btn");

  if (logOutBtn) {
    logOutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      console.log(jwtDecode(localStorage.accessToken));
      // Xoá accessToken và thông tin user
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");
      // Xoá các thông tin khác nếu có...

      const guest = document.getElementById("user_guest");
      const logged = document.getElementById("main_user");

      if (guest && logged) {
        logged.classList.add("hidden");
        guest.classList.remove("hidden");
      }
    });
  }
}