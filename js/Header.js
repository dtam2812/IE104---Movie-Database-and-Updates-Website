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

  // popup modal
  const memberBtn = document.querySelector("#btn-member");
  if (memberBtn) {
    memberBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      let modal = document.querySelector(".modal");
      if (!modal) {
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

        const { Auth_Modaljs } = await import("./AuthModal.js");
        Auth_Modaljs();
        setTimeout(() => window.openLRFModal("login"), 50);
      } else {
        window.openLRFModal("login");
      }
    });
  }

  document.addEventListener("userLoggedIn", (e) => {
    const guest = document.getElementById("user_guest");
    const logged = document.getElementById("main_user");

    if (guest && logged) {
      guest.classList.add("hidden");
      logged.classList.remove("hidden");
    }
  });

  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu.querySelector(".dropdown-list");

  userDropdownMenu.addEventListener("click", (e) => {
    dropdownList.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!userDropdownMenu.contains(e.target)) {
      dropdownList.classList.remove("show");
    }
  });

  const logOutBtn = dropdownList.querySelector("#Log-out-Btn");

  if (logOutBtn) {
    logOutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const guest = document.getElementById("user_guest");
      const logged = document.getElementById("main_user");

      if (guest && logged) {
        logged.classList.add("hidden");
        guest.classList.remove("hidden");
      }
    });
  }
}