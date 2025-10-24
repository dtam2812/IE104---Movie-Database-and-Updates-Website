// //event click doi dau menu
// //event click xo menu
export function headerjs() {
const menuToggle = document.querySelector('.menu-toggle');
const searchGroup = document.querySelector('.search-group');
const searchNav = document.querySelector('.search-toggle');
const searchBox = document.querySelector('.search');
const logo = document.querySelector('.header-logo');
const dropdown = document.querySelector('.menu-film-type.dropdown');
const dropdownBtn = dropdown.querySelector('.dropdown-toggle');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('toggled');
    searchGroup.classList.toggle('toggled');
});

searchNav.addEventListener('click', () => {
  searchNav.classList.toggle('toggled');
  searchBox.classList.toggle('toggled'); 
  logo.classList.toggle('hidden');       
  menuToggle.classList.toggle('hidden'); 
});

dropdownBtn.addEventListener('click', () => {
  dropdown.classList.toggle('toggled');
});

document.addEventListener('click', (e) =>
{
  if(!dropdown.contains(e.target)){
    dropdown.classList.remove('toggled')
  }
});

window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// popup modal
const memberBtn = document.querySelector('#btn-member');
if (memberBtn) {
    memberBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        let modal = document.querySelector('.modal');
        if (!modal) {
            //load file AuthModal.html vào header.html
            const html = await (await fetch('../../view/components/AuthModal.html')).text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            document.body.appendChild(doc.querySelector('.modal'));

            // Load file AuthModal.css vào header.html
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.href;
                if (!document.querySelector(`link[href="${href}"]`)) {
                    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
                }
            });

            // import filr AuthModal.js vào 
            const { Auth_Modaljs } = await import('./AuthModal.js'); 
            Auth_Modaljs();
            setTimeout(() => window.openLRFModal('login'), 50);
        } else {
            window.openLRFModal('login');
        }
    });
}

  //Xử lý sự kiện sau khi user đăng nhập vào
  document.addEventListener('userLoggedIn', (e) => {
  const guest = document.getElementById('user_guest');
  const logged = document.getElementById('main_user');

  if (guest && logged) {
      guest.classList.add('hidden');
      logged.classList.remove('hidden');
  }
  });

  //Xử lý sự kiện khi click vào main user ở heder
  const userDropdownMenu = document.querySelector('.user-dropdown-menu');
  const dropdownList = userDropdownMenu.querySelector('.dropdown-list');
  
  userDropdownMenu.addEventListener('click', (e) => {  
     dropdownList.classList.toggle('show')
  })
  
  //tắt user-dropdown-menu khi click ở bên ngoài menu
  document.addEventListener('click', (e) => {
  if(!userDropdownMenu.contains(e.target)){
    dropdownList.classList.remove('show')}
  });


   //Xử lý sự kiện đăng xuất
  const logOutBtn = dropdownList.querySelector('#Log-out-Btn');

  if (logOutBtn) 
  {
  logOutBtn.addEventListener('click', (e) => {
  e.preventDefault();

  const guest = document.getElementById('user_guest');
  const logged = document.getElementById('main_user');

  if (guest && logged) 
    {
      logged.classList.add('hidden');
      guest.classList.remove('hidden');
    }

  });
  }

} 
