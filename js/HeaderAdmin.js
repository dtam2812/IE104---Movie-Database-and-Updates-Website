// HeaderAdmin.js
export function AdminHeader_js() {
  let adminHeader = document.querySelector('.admin-header');
  
  if (!adminHeader) {
    fetch('/view/components/HeaderAdmin.html')
      .then(response => response.text())
      .then(html => {
        const headerContainer = document.createElement('div');
        headerContainer.innerHTML = html;
        document.body.insertBefore(headerContainer.firstElementChild, document.body.firstChild);
        
        if (!document.querySelector('.admin-menu-overlay')) {
          const overlay = headerContainer.querySelector('.admin-menu-overlay');
          if (overlay) {
            document.body.appendChild(overlay);
          }
        }
        
        initAdminHeader();
      })
      .catch(() => {});
  }
}

function initAdminHeader() {
  const hamburger = document.querySelector('.admin-hamburger');
  const adminMenu = document.querySelector('.admin-menu-container');
  const overlay = document.querySelector('.admin-menu-overlay');
  
  if (hamburger && adminMenu && overlay) {
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });
    
    overlay.addEventListener('click', closeMenu);
    
    const menuLinks = adminMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 1100) {
          closeMenu();
        }
      }, 250);
    });
  }
}

function toggleMenu() {
  const hamburger = document.querySelector('.admin-hamburger');
  const adminMenu = document.querySelector('.admin-menu-container');
  const overlay = document.querySelector('.admin-menu-overlay');
  
  if (hamburger && adminMenu && overlay) {
    const isActive = adminMenu.classList.contains('active');
    isActive ? closeMenu() : openMenu();
  }
}

function openMenu() {
  const hamburger = document.querySelector('.admin-hamburger');
  const adminMenu = document.querySelector('.admin-menu-container');
  const overlay = document.querySelector('.admin-menu-overlay');
  
  hamburger.classList.add('active');
  adminMenu.classList.add('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  const hamburger = document.querySelector('.admin-hamburger');
  const adminMenu = document.querySelector('.admin-menu-container');
  const overlay = document.querySelector('.admin-menu-overlay');
  
  if (hamburger) hamburger.classList.remove('active');
  if (adminMenu) adminMenu.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}