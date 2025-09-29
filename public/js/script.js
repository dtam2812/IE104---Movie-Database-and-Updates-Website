// //event click doi dau menu
// //event click xo menu
export function headerjs() {
const menuToggle = document.querySelector('.menu-toggle');
const searchGroup = document.querySelector('.search-group');
const searchNav = document.querySelector('.search-toggle');
const searchBox = document.querySelector('.search');
const logo = document.querySelector('.header-logo');

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

}
