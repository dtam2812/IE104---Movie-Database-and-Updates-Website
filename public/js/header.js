// //event click doi dau menu
// //event click xo menu
export function headerjs() {
const menuToggle = document.querySelector('.menu-toggle');
const searchGroup = document.querySelector('.search-group');
const searchNav = document.querySelector('.search-toggle');
const searchBox = document.querySelector('.search');
const logo = document.querySelector('.header-logo');
const dropdown = document.querySelector('.menu-film-type.dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle')

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

window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

} 
