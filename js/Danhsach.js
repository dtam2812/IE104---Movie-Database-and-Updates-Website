// ========================================
// KHỞ TẠO BIẾN VÀ CẤU HÌNH
// ========================================

const API_KEY = '8d7f1f7ef4ead0588ee2c66d06f75799'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p/w300'
const LANGUAGE = 'vi-VN'

// Lưu thông tin filter hiện tại
let currentPage = 1
let currentMovieType = 'all' // 'movie', 'tv', hoặc 'all'
let currentCountry = []
let currentGenre = []
let currentArrange = 'new'
let totalPages = 100

// Biến lưu template HTML
let movieCardTemplate = ''

// Genres chỉ dành cho phim lẻ
const movieOnlyGenres = ['28', '12', '14', '36', '27', '10402', '10749', '878', '53', '10752']
// Genres chỉ dành cho phim bộ
const tvOnlyGenres = ['10759', '10762', '10763', '10764', '10765', '10766', '10767', '10768']

// Map tên thể loại với genre ID
const genreMap = {
    'tình cảm': '10749',
    'kinh dị': '27',
    'hành động': '28',
    'hài': '35',
    'gia đình': '10751'
}

// ========================================
// XỬ LÝ FILTER TOGGLE
// ========================================

const filterToggle = document.querySelector('.filter__toggle')
const filterSelect = document.querySelector('.filter__select')
const faFilter = document.querySelector('.fa-solid.fa-filter')

filterToggle.addEventListener('click', function(e) {
    filterSelect.classList.toggle('hidden')
    faFilter.classList.toggle('fa-filter-active')
})

// ========================================
// XỬ LÝ QUỐC GIA
// ========================================

const selectListItemCountry = document.querySelectorAll('.filter__select-list.country .filter__select-list-item')
const selectListItemCountryAll = document.querySelector('.filter__select-list.country .all')

selectListItemCountry.forEach(function(current) {
    current.addEventListener('click', function(e) {
        const currentActive = document.querySelector('.filter__select-list.country .filter__select--active')
        if(currentActive) {
            currentActive.classList.remove('filter__select--active')
        }
        current.classList.add('filter__select--active')
    })
})

// ========================================
// XỬ LÝ LOẠI PHIM
// ========================================

const itemMovieType = document.querySelectorAll('.filter__select-list.movie-type .filter__select-list-item')

// Hàm ẩn/hiện genres theo loại phim
function updateGenreVisibility(type) {
    const allGenreItems = document.querySelectorAll('.filter__select-list.movie-genre .filter__select-list-item')
    
    allGenreItems.forEach(function(item) {
        const genreId = item.getAttribute('data-genre')
        
        if(genreId === 'all') return
        
        if(type === 'movie') {
            if(tvOnlyGenres.includes(genreId)) {
                item.style.display = 'none'
                item.classList.remove('filter__select--active')
            } else {
                item.style.display = 'block'
            }
        } else if(type === 'tv') {
            if(movieOnlyGenres.includes(genreId)) {
                item.style.display = 'none'
                item.classList.remove('filter__select--active')
            } else {
                item.style.display = 'block'
            }
        } else {
            item.style.display = 'block'
        }
    })
}

itemMovieType.forEach(function(current) {
    current.addEventListener('click', function(e) {
        const itemMovieTypeActive = document.querySelector('.filter__select-list.movie-type .filter__select--active')

        if(current != itemMovieTypeActive) {
            current.classList.add('filter__select--active')
            itemMovieTypeActive.classList.remove('filter__select--active')
            
            const selectedType = current.getAttribute('data-type')
            updateGenreVisibility(selectedType)
        }
    })
})

// ========================================
// XỬ LÝ THỂ LOẠI
// ========================================

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

        const lastActive = document.querySelector('.filter__select-list.movie-genre .filter__select--active')
        if(!lastActive) {
            itemMovieGenreAll.classList.add('filter__select--active')
        }
    })
})

// ========================================
// XỬ LÝ SẮP XẾP
// ========================================

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

// ========================================
// ĐÓNG FILTER
// ========================================

const filterCloseBtn = document.querySelector('.filter__close-btn')

filterCloseBtn.addEventListener('click', function(e) {
    filterSelect.classList.add('hidden')
    faFilter.classList.remove('fa-filter-active')
})

// ========================================
// XỬ LÝ URL PARAMS (từ nav)
// ========================================

function getUrlParams() {
    let params = new URLSearchParams(window.location.search)
    return {
        type: params.get('type'),       // movie/tv/all
        genre: params.get('genre'),     // 10749, 28...
        country: params.get('country')  // US, KR...
    }
}

function applyUrlParams() {
    let params = getUrlParams()
    
    // Reset tất cả về mặc định trước
    resetFiltersToDefault()
    
    // 1. Set loại phim (movie/tv/all)
    if(params.type) {
        currentMovieType = params.type
        
        // Bỏ active tất cả
        itemMovieType.forEach(function(item) {
            item.classList.remove('filter__select--active')
        })
        
        // Active nút tương ứng
        let targetType = document.querySelector('.filter__select-list.movie-type [data-type="' + params.type + '"]')
        if(targetType) {
            targetType.classList.add('filter__select--active')
        }
        
        // Cập nhật hiển thị genres
        updateGenreVisibility(params.type)
    }
    
    // 2. Set thể loại
    if(params.genre) {
        currentGenre = [params.genre]
        
        // Bỏ active "Tất cả"
        itemMovieGenreAll.classList.remove('filter__select--active')
        
        // Active thể loại tương ứng
        let targetGenre = document.querySelector('.filter__select-list.movie-genre [data-genre="' + params.genre + '"]')
        if(targetGenre) {
            targetGenre.classList.add('filter__select--active')
        }
    }
    
    // 3. Set quốc gia
    if(params.country) {
        currentCountry = [params.country]
        
        // Bỏ active "Tất cả"
        selectListItemCountryAll.classList.remove('filter__select--active')
        
        // Active quốc gia tương ứng
        let targetCountry = document.querySelector('.filter__select-list.country [data-country="' + params.country + '"]')
        if(targetCountry) {
            targetCountry.classList.add('filter__select--active')
        }
    }
}

// Hàm reset filter về mặc định
function resetFiltersToDefault() {
    // Reset quốc gia về "Tất cả"
    selectListItemCountry.forEach(function(item) {
        item.classList.remove('filter__select--active')
    })
    selectListItemCountryAll.classList.add('filter__select--active')
    
    // Reset loại phim về "Tất cả"
    itemMovieType.forEach(function(item) {
        item.classList.remove('filter__select--active')
    })
    document.querySelector('.filter__select-list.movie-type [data-type="all"]').classList.add('filter__select--active')
    
    // Reset thể loại về "Tất cả"
    itemMovieGenre.forEach(function(item) {
        item.classList.remove('filter__select--active')
    })
    itemMovieGenreAll.classList.add('filter__select--active')
    
    // Reset sắp xếp về "Mới nhất"
    itemArrange.forEach(function(item) {
        item.classList.remove('filter__select--active')
    })
    document.querySelector('.filter__select-list.arrange [data-arrange="new"]').classList.add('filter__select--active')
    
    // Reset biến state
    currentMovieType = 'all'
    currentCountry = []
    currentGenre = []
    currentArrange = 'new'
    currentPage = 1
    
    // Hiển thị tất cả genres
    updateGenreVisibility('all')
}

// ========================================
// CẬP NHẬT TIÊU ĐỀ TRANG
// ========================================

function updatePageTitle() {
    const titleElement = document.querySelector('.main__title')
    if(!titleElement) return
    
    const params = getUrlParams()
    
    // Nếu có params type
    if(params.type === 'movie') {
        titleElement.textContent = 'Phim lẻ'
    } else if(params.type === 'tv') {
        titleElement.textContent = 'Phim bộ'
    } else {
        titleElement.textContent = 'Danh sách phim'
    }
}

// ========================================
// LOAD TEMPLATE VÀ KHỞI ĐỘNG
// ========================================

fetch('../components/MovieCardRender.html')
    .then(function(response) {
        return response.text()
    })
    .then(function(html) {
        movieCardTemplate = html
        
        // Kiểm tra xem có phải từ nav "Bộ lọc" không
        const params = getUrlParams()
        const isFilterNav = params.type === 'all' && !params.genre && !params.country
        
        // Nếu từ nav "Bộ lọc" → mở bộ lọc
        if(isFilterNav && window.location.search.includes('type=all')) {
            filterSelect.classList.remove('hidden')
            faFilter.classList.add('fa-filter-active')
        }
        
        // Áp dụng params từ URL (nếu có)
        applyUrlParams()
        
        // Cập nhật tiêu đề trang
        updatePageTitle()
        
        // Sau đó mới render phim
        render()
    })
    .catch(function(error) {
        console.log('Lỗi load template:', error)
    })

// ========================================
// RENDER PHIM
// ========================================

function render() {
    if(currentMovieType === 'all') {
        renderBothMovieAndTV()
    } else {
        renderOneType()
    }
}

function renderOneType() {
    let apiUrl = createApiUrl(currentMovieType, currentPage)
    
    fetch(apiUrl)
        .then(function(response) {
            return response.json()
        })
        .then(function(data) {
            let movieList = data.results
            totalPages = Math.min(data.total_pages, 100)
            updatePageNumber()
            displayMovies(movieList, currentMovieType)
        })
        .catch(function(error) {
            console.log('Lỗi:', error)
        })
}

function renderBothMovieAndTV() {
    let movieApiUrl = createApiUrl('movie', currentPage)
    let tvApiUrl = createApiUrl('tv', currentPage)
    
    fetch(movieApiUrl)
        .then(function(response) {
            return response.json()
        })
        .then(function(movieData) {
            return fetch(tvApiUrl)
                .then(function(response) {
                    return response.json()
                })
                .then(function(tvData) {
                    let allMovies = []
                    
                    for(let i = 0; i < Math.min(10, movieData.results.length); i++) {
                        allMovies.push({
                            ...movieData.results[i],
                            movieType: 'movie'
                        })
                    }
                    
                    for(let i = 0; i < Math.min(10, tvData.results.length); i++) {
                        allMovies.push({
                            ...tvData.results[i],
                            movieType: 'tv'
                        })
                    }
                    
                    let maxPages = Math.max(movieData.total_pages, tvData.total_pages)
                    totalPages = Math.min(maxPages, 100)
                    updatePageNumber()
                    displayMovies(allMovies, 'all')
                })
        })
        .catch(function(error) {
            console.log('Lỗi:', error)
        })
}

function createApiUrl(type, page) {
    let url = BASE_URL + '/discover/' + type + '?api_key=' + API_KEY + '&language=' + LANGUAGE + '&page=' + page
    
    if(currentGenre.length > 0) {
        url = url + '&with_genres=' + currentGenre.join(',')
    }
    
    if(currentCountry.length > 0) {
        url = url + '&with_origin_country=' + currentCountry.join('|')
    }
    
    if(currentArrange === 'new') {
        url = url + '&sort_by=first_air_date.desc'
    } else if(currentArrange === 'update') {
        url = url + '&sort_by=popularity.desc'
    } else if(currentArrange === 'imdb') {
        url = url + '&sort_by=vote_average.desc&vote_count.gte=100'
    } else if(currentArrange === 'view') {
        url = url + '&sort_by=popularity.desc'
    }
    
    return url
}

function displayMovies(movieList, type) {
    let html = ''
    
    for(let i = 0; i < movieList.length; i++) {
        let movie = movieList[i]
        
        let isMovie = false
        if(type === 'all') {
            isMovie = (movie.movieType === 'movie')
        } else {
            isMovie = (type === 'movie')
        }
        
        let movieId = movie.id
        let movieName = isMovie ? movie.title : movie.name
        let originalName = isMovie ? movie.original_title : movie.original_name
        let posterPath = IMAGE_URL + movie.poster_path
        
        let cardHtml = movieCardTemplate
            .replace(/{{id}}/g, movieId)
            .replace(/{{poster}}/g, posterPath)
            .replace(/{{title}}/g, movieName)
            .replace(/{{original_title}}/g, originalName)
        
        if(!isMovie) {
            cardHtml = cardHtml.replace('<span>Movie</span>', '<span>TV Show</span>')
        }
        
        html += cardHtml
    }
    
    document.querySelector('.movie').innerHTML = html
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updatePageNumber() {
    document.querySelector('.pagination__main span:last-child').textContent = '/ ' + totalPages
    updatePaginationButtons()
}

// ========================================
// LỌC PHIM (khi nhấn nút "Lọc kết quả")
// ========================================

const filterBtn = document.querySelector('.filter__select-btn')

filterBtn.addEventListener('click', function(e) {
    // Lấy quốc gia
    let selectedCountries = document.querySelectorAll('.filter__select-list.country .filter__select--active')
    currentCountry = []
    selectedCountries.forEach(function(item) {
        let code = item.getAttribute('data-country')
        if(code !== 'all') {
            currentCountry.push(code)
        }
    })
    
    // Lấy loại phim
    let selectedType = document.querySelector('.filter__select-list.movie-type .filter__select--active')
    currentMovieType = selectedType.getAttribute('data-type')
    
    // Lấy thể loại
    let selectedGenres = document.querySelectorAll('.filter__select-list.movie-genre .filter__select--active')
    currentGenre = []
    selectedGenres.forEach(function(item) {
        let genreId = item.getAttribute('data-genre')
        if(genreId !== 'all') {
            currentGenre.push(genreId)
        }
    })
    
    // Lấy cách sắp xếp
    let selectedArrange = document.querySelector('.filter__select-list.arrange .filter__select--active')
    currentArrange = selectedArrange.getAttribute('data-arrange')
    
    // Reset về trang 1
    currentPage = 1
    document.querySelector('.pagination-page-current').textContent = '1'
    
    // Đóng bộ lọc
    filterSelect.classList.add('hidden')
    faFilter.classList.remove('fa-filter-active')
    
    // Render phim mới
    render()
})

// ========================================
// PHÂN TRANG
// ========================================

const leftPag = document.querySelector('.pagination-left-arrow') 
const rightPag = document.querySelector('.pagination-right-arrow')

function updatePaginationButtons() {
    if(currentPage <= 1) {
        leftPag.classList.add('disable')
    } else {
        leftPag.classList.remove('disable')
    }
    
    if(currentPage >= totalPages) {
        rightPag.classList.add('disable')
    } else {
        rightPag.classList.remove('disable')
    }
}

rightPag.addEventListener('click', function(e) {
    if(currentPage < totalPages) {
        currentPage = currentPage + 1
        document.querySelector('.pagination-page-current').textContent = currentPage
        render()
    }
})

leftPag.addEventListener('click', function(e) {
    if(currentPage > 1) {
        currentPage = currentPage - 1
        document.querySelector('.pagination-page-current').textContent = currentPage
        render()
    }
})