import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";
import { checkTokenOnPageLoad, startTokenExpirationCheck } from "./TokenExpirationHandler.js";  // Thêm import cho token check
import { checkAndShowLoginPopup } from "./AutoLoginPopup.js";  // Thêm import cho auto popup

// Hàm kiểm tra trạng thái đăng nhập
function checkAuthStatus() {
  const accessToken = localStorage.getItem("accessToken");
  const guest = document.getElementById("user_guest");
  const logged = document.getElementById("main_user");

  if (accessToken && guest && logged) {
    // Đã đăng nhập - hiện user menu, ẩn button thành viên
    guest.classList.add("hidden");
    logged.classList.remove("hidden");

    // Load thông tin user và check role
    loadUserInfo();
    checkAdminRole();
  } else {
    // Chưa đăng nhập - hiện button thành viên
    if (guest) guest.classList.remove("hidden");
    if (logged) logged.classList.add("hidden");
    
    // Remove admin menu nếu có
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

// Hàm xóa menu Admin (nếu tồn tại)
function removeAdminMenu() {
  const existingAdminMenu = document.getElementById("admin-menu-item");
  if (existingAdminMenu) {
    existingAdminMenu.remove();
  }
  // Clear separator để tránh duplicate
  const existingSeparator = document.getElementById("admin-menu-separator");
  if (existingSeparator) {
    existingSeparator.remove();
  }
}

// Hàm tạo menu Admin động (fix vị trí: dưới "Đăng xuất", cuối dropdown)
function createAdminMenu() {
  // Remove existing admin menu first
  removeAdminMenu();
  
  const dropdownList = document.querySelector(".user-dropdown-menu .dropdown-list");
  if (!dropdownList) {
    console.error("Dropdown list not found");
    return;
  }

  // Tìm nút "Đăng xuất" (a#Log-out-Btn)
  const logoutBtn = document.getElementById("Log-out-Btn");
  if (!logoutBtn) {
    console.error("Logout button not found");
    return;
  }

  // Create admin menu item
  const adminMenuItem = document.createElement("a");
  adminMenuItem.id = "admin-menu-item";
  adminMenuItem.className = "dropdown-item";
  adminMenuItem.href = "/client/view/pages/AdminUsers.html";  // Sửa thành absolute path
  adminMenuItem.innerHTML = `
    <div class="line-center">
      <i class="fa-solid fa-users-gear"></i>
      <span>Quản lý</span>
    </div>
  `;

  // Create separator (trước "Quản lý")
  const separator = document.createElement("hr");
  separator.id = "admin-menu-separator";

  // Insert sau logout button (cuối dropdown)
  dropdownList.appendChild(separator);
  dropdownList.appendChild(adminMenuItem);

}

// Hàm kiểm tra role Admin và hiển thị menu Quản lý
function checkAdminRole() {
  const accessToken = localStorage.getItem("accessToken");
  
  if (accessToken) {
    try {
      const payloadDecoded = jwtDecode(accessToken);
      console.log("Checking admin role:", payloadDecoded.role);  
      
      // Nếu là admin thì tạo menu "Quản lý" (thống nhất lowercase "admin")
      if (payloadDecoded.role === "admin") {
        createAdminMenu();
      } else {
        // Không phải admin thì xóa menu (nếu có)
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

export function headerjs() {
  const menuToggle = document.querySelector(".menu-toggle");
  const searchGroup = document.querySelector(".search-group");
  const searchNav = document.querySelector(".search-toggle");
  const searchBox = document.querySelector(".search");
  const logo = document.querySelector(".header-logo");
  const dropdown = document.querySelector(".menu-film-type.dropdown");
  const dropdownBtn = document.querySelector(".dropdown-toggle");

  // Check token on load (nếu expire → auto logout)
  if (!checkTokenOnPageLoad()) {
    checkAuthStatus();  
    return;  
  }

  // Start token check nếu có token (global cho mọi page)
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    startTokenExpirationCheck();
  }

  // Check và show popup nếu token expired flag set (global)
  checkAndShowLoginPopup();

  // Kiểm tra trạng thái đăng nhập ngay khi load trang
  checkAuthStatus();

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });

  searchNav.addEventListener("click", () => {
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
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

  // Popup modal - chỉ cho phép khi chưa đăng nhập
  const memberBtn = document.querySelector("#btn-member");
  if (memberBtn) {
    memberBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Kiểm tra đã đăng nhập chưa
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        // Đã đăng nhập rồi thì không mở modal
        console.log("User đã đăng nhập, không mở modal");
        return;
      }

      let modal = document.querySelector(".modal");
      if (!modal) {
        // Load file AuthModal.html vào header.html
        const html = await (
          await fetch("/client/view/components/AuthModal.html")  
        ).text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        document.body.appendChild(doc.querySelector(".modal"));

        // Load file AuthModal.css vào header.html
        doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          const href = link.href;
          if (!document.querySelector(`link[href="${href}"]`)) {
            const newLink = Object.assign(document.createElement("link"), {
              rel: "stylesheet",
              href: href.startsWith('http') ? href : `/client${href.startsWith('/') ? '' : '/'}${href}`,  
            });
            document.head.appendChild(newLink);
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
    console.log("User logged in event triggered");
    // Kiểm tra lại auth status để cập nhật UI
    checkAuthStatus();
  });

  // Xử lý sự kiện khi click vào main user ở header
  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu?.querySelector(".dropdown-list");

  if (userDropdownMenu && dropdownList) {
    userDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation(); // Ngăn event bubble lên document
      dropdownList.classList.toggle("show");
    });

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

      console.log("Logging out user");
      
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          console.log("Current user:", jwtDecode(token));
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }

      // Xoá accessToken và thông tin user
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");

      // Cập nhật UI
      checkAuthStatus();

      // Chuyển về trang chủ sau khi logout (sử dụng absolute path)
      window.location.href = "/client/view/pages/HomePage.html";
    });
  }
}