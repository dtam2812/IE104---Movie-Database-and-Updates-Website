// Filter toggle
const filterToggle = document.querySelector('.filter__toggle')

filterToggle.addEventListener('click', function(e) {
    const filterSelect = document.querySelector('.filter__select')
    filterSelect.classList.toggle('hidden')

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
    selectListItemCountryAll.classList.add('filter__select--active')
})

selectListItemCountry.forEach(function(current) {
    current.addEventListener('click', function(e) {
        selectListItemCountryAll.classList.remove('filter__select--active')
        current.classList.toggle('filter__select--active')

        // Bật tất cả nếu bỏ chọn tất cả các quốc gia
        const lastActive = document.querySelector('.filter__select-list.country .filter__select--active')
        if(!lastActive) {
            selectListItemCountryAll.classList.add('filter__select--active')
        }
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
    itemMovieGenreAll.classList.add('filter__select--active')
})

itemMovieGenre.forEach(function(current) {
    current.addEventListener('click', function(e) {
        itemMovieGenreAll.classList.remove('filter__select--active')
        current.classList.toggle('filter__select--active')

        // Bật tất cả nếu bỏ chọn tất cả các thể loại
        const lastActive = document.querySelector('.filter__select-list.movie-genre .filter__select--active')
        if(!lastActive) {
            itemMovieGenreAll.classList.add('filter__select--active')
        }
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

// Đóng filter
const filterCloseBtn = document.querySelector('.filter__close-btn')

filterCloseBtn.addEventListener('click', function(e) {
    const filterSelect = document.querySelector('.filter__select')
    filterSelect.classList.toggle('hidden')

    const faFilter = document.querySelector('.fa-solid.fa-filter')
    faFilter.classList.toggle('fa-filter-active')
})

// Cấu hình API
const API_KEY = '8d7f1f7ef4ead0588ee2c66d06f75799'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p/w300'
const LANGUAGE = 'vi-VN'

// API ban đầu
let movieApi = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=${LANGUAGE}&page=1&sort_by=first_air_date.desc`
let totalPages = 100 // Biến lưu tổng số trang
render()

// Render phim
function render() {
    fetch(movieApi)
    .then(res => res.json())
    .then(data => {
        const result = data.results
        
        // Cập nhật tổng số trang
        totalPages = Math.min(data.total_pages, 100)
        document.querySelector('.pagination__main span:last-child').textContent = `/ ${totalPages}`
        
        // Kiểm tra và update trạng thái nút pagination
        updatePaginationButtons()
        
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
                        <img src="${IMAGE_URL}${result[i].poster_path}" alt="">
                    </div>
                </a>
                <div class="info">
                    <h4 class="vietnam-title">
                        <a title="${result[i].name}" href="./PhimBoDetail.html">${result[i].name}</a>
                    </h4>
                    <h4 class="other-title">
                        <a title="${result[i].original_name}" href="./PhimBoDetail.html">${result[i].original_name}</a>
                    </h4>
                </div>
            </div>
            `
        }
        
        document.querySelector('.movie').innerHTML = html
        window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    .catch(error => {
        console.log(error)
    })
}

// Lọc kết quả
const filterBtn = document.querySelector('.filter__select-btn')

filterBtn.addEventListener('click', function(e) {
    // Lấy quốc gia đã chọn
    const countrySelected = document.querySelectorAll('.filter__select-list.country .filter__select--active')
    let countryList = []
    countrySelected.forEach(function(item) {
        const countryCode = item.getAttribute('data-country')
        if(countryCode != 'all') {
            countryList.push(countryCode)
        }
    })
    
    // Lấy loại phim đã chọn
    const typeSelected = document.querySelector('.filter__select-list.movie-type .filter__select--active')
    const movieType = typeSelected.getAttribute('data-type')
    
    // Lấy thể loại đã chọn
    const genreSelected = document.querySelectorAll('.filter__select-list.movie-genre .filter__select--active')
    let genreList = []
    genreSelected.forEach(function(item) {
        const genreId = item.getAttribute('data-genre')
        if(genreId != 'all') {
            genreList.push(genreId)
        }
    })
    
    // Lấy cách sắp xếp
    const arrangeSelected = document.querySelector('.filter__select-list.arrange .filter__select--active')
    const arrangeType = arrangeSelected.getAttribute('data-arrange')
    
    // Tạo API mới
    // Xác định loại phim (movie hoặc tv)
    let apiType = 'tv' // Mặc định là TV
    if(movieType === 'movie') {
        apiType = 'movie'
    } else if(movieType === 'tv') {
        apiType = 'tv'
    }
    
    // Tạo API cơ bản
    let newApi = `${BASE_URL}/discover/${apiType}?api_key=${API_KEY}&language=${LANGUAGE}&page=1`
    
    // Thêm thể loại
    if(genreList.length > 0) {
        newApi += '&with_genres=' + genreList.join(',')
    }
    
    // Thêm quốc gia
    if(countryList.length > 0) {
        newApi += '&with_origin_country=' + countryList.join('|')
    }
    
    // Thêm sắp xếp
    if(arrangeType == 'new') {
        newApi += '&sort_by=first_air_date.desc'
    } else if(arrangeType == 'update') {
        newApi += '&sort_by=popularity.desc'
    } else if(arrangeType == 'imdb') {
        newApi += '&sort_by=vote_average.desc&vote_count.gte=100'
    } else if(arrangeType == 'view') {
        newApi += '&sort_by=popularity.desc'
    }
    
    // Cập nhật API và render lại
    movieApi = newApi
    
    // Reset về trang 1
    document.querySelector('.pagination-page-current').textContent = '1'
    
    // Đóng bộ lọc
    const filterSelect = document.querySelector('.filter__select')
    filterSelect.classList.add('hidden')
    const faFilter = document.querySelector('.fa-solid.fa-filter')
    faFilter.classList.remove('fa-filter-active')
    
    // Render phim mới
    render()
})

// Phân trang
const leftPag = document.querySelector('.pagination-left-arrow') 
const rightPag = document.querySelector('.pagination-right-arrow')

// Hàm cập nhật trạng thái nút pagination
function updatePaginationButtons() {
    const currentPage = Number(document.querySelector('.pagination-page-current').textContent)
    
    // Nút trái
    if(currentPage <= 1) {
        leftPag.classList.add('disable')
    } else {
        leftPag.classList.remove('disable')
    }
    
    // Nút phải
    if(currentPage >= totalPages) {
        rightPag.classList.add('disable')
    } else {
        rightPag.classList.remove('disable')
    }
}

// Nút sang phải
rightPag.addEventListener('click', function(e) {
    // Lấy URL từ movieApi hiện tại
    const url = new URL(movieApi)
    const currentPage = Number(url.searchParams.get('page'))
    
    // Kiểm tra không vượt quá tổng số trang
    if(currentPage < totalPages) {
        const nextPage = currentPage + 1
        
        // Cập nhật URL
        url.searchParams.set('page', nextPage)
        movieApi = url.toString()
        
        // Cập nhật UI
        document.querySelector('.pagination-page-current').textContent = nextPage
        
        // Render
        render()
    }
})

// Nút sang trái
leftPag.addEventListener('click', function(e) {
    // Lấy URL từ movieApi hiện tại
    const url = new URL(movieApi)
    const currentPage = Number(url.searchParams.get('page'))
    
    // Kiểm tra không nhỏ hơn 1
    if(currentPage > 1) {
        const prevPage = currentPage - 1
        
        // Cập nhật URL
        url.searchParams.set('page', prevPage)
        movieApi = url.toString()
        
        // Cập nhật UI
        document.querySelector('.pagination-page-current').textContent = prevPage
        
        // Render
        render()
    }
})