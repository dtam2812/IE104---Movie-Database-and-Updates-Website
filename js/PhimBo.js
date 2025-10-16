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

// Movie
let movieApi = 'https://api.themoviedb.org/3/tv/popular?api_key=8d7f1f7ef4ead0588ee2c66d06f75799&language=vi-VN&page=1'
render()

// render
function render() {
    fetch(movieApi)
    .then(res => res.json())
    .then(data => {
        const result = data.results
        let html = ''
        for (let i = 0; i < result.length; i++) {
            html += `
            <div class="movie-box">
                <a class="movie-card" href="./PhimBoDetail.html">
                    <div class="card-info-top">
                        <div class="card-info-ep-top">
                            <span>TV Show</span>
                        </div>
                    </div>
                    <div class="card-info-bot">
                        <div class="card-info-ep-bot">
                            <span>PĐ.<strong>10</strong></span>
                        </div>
                    </div>
                    <div>
                        <img src="https://image.tmdb.org/t/p/w300${result[i].poster_path}" alt="">
                    </div>
                </a>
                <div class="info">
                    <h4 class="vietnam-title">
                        <a title="Đột Kích Đài Truyền Hình" href="./PhimBoDetail.html">${result[i].name}</a>
                    </h4>
                    <h4 class="other-title">
                        <a title="Hoso Kyoku Senkyo" href="./PhimBoDetail.html">${result[i].original_name}</a>
                    </h4>
                </div>
            </div>
            `
        }
        document.querySelector('.movie').innerHTML = html
    })
    .catch(error => console.log(error))
}

// pagination
const tempApi = new URL(movieApi)
const leftPag = document.querySelector('.pagination-left-arrow') 
const rightPag = document.querySelector('.pagination-right-arrow')

// right click
rightPag.addEventListener('click', function(e) {
    const currentPageNumber = Number(tempApi.searchParams.get('page'))
    let currentPage = document.querySelector('.pagination-page-current')
    currentPage.textContent = currentPageNumber + 1

    tempApi.searchParams.set('page', currentPageNumber + 1)
    movieApi = tempApi.toString()

    if(currentPage.textContent > 1) {
        leftPag.classList.remove('disable')
    }

    render()
})

// left click
leftPag.addEventListener('click', function(e) {
    const currentPageNumber = Number(tempApi.searchParams.get('page'))
    
    if(currentPageNumber > 1) {
        let currentPage = document.querySelector('.pagination-page-current')
        currentPage.textContent = currentPageNumber - 1
    
        tempApi.searchParams.set('page', currentPageNumber - 1)
        movieApi = tempApi.toString()
        
        // Nếu page = 1 thì không cho click sang trái 
        if(tempApi.searchParams.get('page') == 1) {
            leftPag.classList.add('disable')
        }
    
        render()
    }
})




