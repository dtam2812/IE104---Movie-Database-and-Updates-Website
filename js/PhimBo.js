// Filter toggle
const filterToggle = document.querySelector('.filter__toggle')

filterToggle.addEventListener('click', function(e) {
    // ẩn hiện bộ lọc
    const filterSelect = document.querySelector('.filter__select')
    filterSelect.classList.toggle('hidden')

    // màu filter icon
    const faFilter = document.querySelector('.fa-solid.fa-filter')
    faFilter.classList.toggle('fa-filter-active')
})

// Quốc gia
const selectListItemCountry = document.querySelectorAll('.filter__select-list.country .filter__select-list-item')
const selectListItemCountryAll = document.querySelector('.filter__select-list.country .all')

selectListItemCountryAll.addEventListener('click', function(e) {
    selectListItemCountry.forEach(function(current) {
        current.classList.remove('filter__select--active')
    })
})

selectListItemCountry.forEach(function(current) {
    current.addEventListener('click', function(e) {
        selectListItemCountryAll.classList.remove('filter__select--active')
        current.classList.toggle('filter__select--active')
    })
})

// Loại phim
const itemMovieType = document.querySelectorAll('.filter__select-list.movie-type .filter__select-list-item')

itemMovieType.forEach(function(current) {
    current.addEventListener('click', function(e) {
        const itemMovieTypeActive = document.querySelector('.filter__select-list.movie-type .filter__select--active')

        if(current != itemMovieTypeActive) {
            current.classList.add('filter__select--active')
            itemMovieTypeActive.classList.remove('filter__select--active')
        }
    })
})

// Thể loại
const itemMovieGenre = document.querySelectorAll('.filter__select-list.movie-genre .filter__select-list-item')
const itemMovieGenreAll = document.querySelector('.filter__select-list.movie-genre .all')

itemMovieGenreAll.addEventListener('click', function(e) {
    itemMovieGenre.forEach(function(current) {
        current.classList.remove('filter__select--active')
    })
})

itemMovieGenre.forEach(function(current) {
    current.addEventListener('click', function(e) {
        itemMovieGenreAll.classList.remove('filter__select--active')
        current.classList.toggle('filter__select--active')
    })
})

// Sắp xếp
const itemArrange = document.querySelectorAll('.filter__select-list.arrange .filter__select-list-item')

itemArrange.forEach(function(current) {
    current.addEventListener('click', function(e) {
        const itemArrangeActive = document.querySelector('.filter__select-list.arrange .filter__select--active')

        if(itemArrangeActive != current) {
            current.classList.add('filter__select--active')
            itemArrangeActive.classList.remove('filter__select--active')
        }
    })
})

// filter__close-btn
const filterCloseBtn = document.querySelector('.filter__close-btn')

filterCloseBtn.addEventListener('click', function(e) {
    const filterSelect = document.querySelector('.filter__select')
    filterSelect.classList.toggle('hidden')
})
