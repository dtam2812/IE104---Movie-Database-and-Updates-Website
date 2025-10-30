// Cấu hình
const API_KEY = '8d7f1f7ef4ead0588ee2c66d06f75799'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p/w300'
const LANGUAGE = 'vi-VN'

// Lưu thông tin filter hiện tại
let currentPage = 1
let currentMovieType = 'all' 
let currentCountry = ''
let currentGenre = []
let currentArrange = 'new'
let totalPages = 100

// Template HTML
let movieCardTemplate = ''

// Genres chỉ dành cho phim lẻ và phim bộ
const movieOnlyGenres = ['28', '12', '14', '36', '27', '10402', '10749', '878', '53', '10752']
const tvOnlyGenres = ['10759', '10762', '10763', '10764', '10765', '10766', '10767', '10768']

// Khai báo các DOM hay dùng
const filterToggle = document.querySelector('.filter__toggle')
const filterSelect = document.querySelector('.filter__select')
const faFilter = document.querySelector('.fa-solid.fa-filter')
const filterCloseBtn = document.querySelector('.filter__close-btn')
const filterBtn = document.querySelector('.filter__select-btn')
const movieContainer = document.querySelector('.movie')
const pageCurrentSpan = document.querySelector('.pagination-page-current')
const pageTotalSpan = document.querySelector('.pagination__main span:last-child')
const leftPag = document.querySelector('.pagination-left-arrow')
const rightPag = document.querySelector('.pagination-right-arrow')

const selectListItemCountry = document.querySelectorAll('.filter__select-list.country .filter__select-list-item')
const selectListItemCountryAll = document.querySelector('.filter__select-list.country .all')
const itemMovieType = document.querySelectorAll('.filter__select-list.movie-type .filter__select-list-item')
const itemMovieGenre = document.querySelectorAll('.filter__select-list.movie-genre .filter__select-list-item')
const itemMovieGenreAll = document.querySelector('.filter__select-list.movie-genre .all')
const itemArrange = document.querySelectorAll('.filter__select-list.arrange .filter__select-list-item')

// Filter toggle
filterToggle.addEventListener('click', () => {
    filterSelect.classList.toggle('hidden')
    faFilter.classList.toggle('fa-filter-active')
})

filterCloseBtn.addEventListener('click', () => {
    filterSelect.classList.add('hidden')
    faFilter.classList.remove('fa-filter-active')
})

// Quốc gia
selectListItemCountry.forEach(current => {
    current.addEventListener('click', () => {
        const currentActive = document.querySelector('.filter__select-list.country .filter__select--active')
        if(currentActive) {
            currentActive.classList.remove('filter__select--active')
        }
        current.classList.add('filter__select--active')
    })
})

// Loại phim
function updateGenreVisibility(type) {
    const allGenreItems = document.querySelectorAll('.filter__select-list.movie-genre .filter__select-list-item')
    
    allGenreItems.forEach(item => {
        const genreId = item.getAttribute('data-genre')
        
        if(genreId === 'all') return
        
        if(type === 'movie') {
            if(tvOnlyGenres.includes(genreId)) {
                item.classList.add('hidden')
                item.classList.remove('filter__select--active')
            } else {
                item.classList.remove('hidden')
            }
        } else if(type === 'tv') {
            if(movieOnlyGenres.includes(genreId)) {
                item.classList.add('hidden')
                item.classList.remove('filter__select--active')
            } else {
                item.classList.remove('hidden')
            }
        } else {
            item.classList.remove('hidden')
        }
    })
    
    if(!document.querySelector('.filter__select-list.movie-genre .filter__select--active')) {
        itemMovieGenreAll.classList.add('filter__select--active')
    }
}

itemMovieType.forEach(current => {
    current.addEventListener('click', () => {
        const itemMovieTypeActive = document.querySelector('.filter__select-list.movie-type .filter__select--active')

        if(current !== itemMovieTypeActive) {
            current.classList.add('filter__select--active')
            itemMovieTypeActive.classList.remove('filter__select--active')
            
            const selectedType = current.getAttribute('data-type')
            updateGenreVisibility(selectedType)
        }
    })
})

// Thể loại
itemMovieGenreAll.addEventListener('click', () => {
    itemMovieGenre.forEach(current => {
        current.classList.remove('filter__select--active')
    })
    itemMovieGenreAll.classList.add('filter__select--active')
})

itemMovieGenre.forEach(current => {
    current.addEventListener('click', () => {
        itemMovieGenreAll.classList.remove('filter__select--active')
        current.classList.toggle('filter__select--active')

        const lastActive = document.querySelector('.filter__select-list.movie-genre .filter__select--active')
        if(!lastActive) {
            itemMovieGenreAll.classList.add('filter__select--active')
        }
    })
})

// Sắp xếp
itemArrange.forEach(current => {
    current.addEventListener('click', () => {
        const itemArrangeActive = document.querySelector('.filter__select-list.arrange .filter__select--active')

        if(itemArrangeActive !== current) {
            current.classList.add('filter__select--active')
            itemArrangeActive.classList.remove('filter__select--active')
        }
    })
})

// Nav
function getUrlParams() {
    const params = new URLSearchParams(window.location.search)
    return {
        type: params.get('type'),
        genre: params.get('genre'),
        country: params.get('country')
    }
}

// Reset về mặc định
function resetFiltersToDefault() {
    // Quốc gia
    selectListItemCountry.forEach(item => {
        item.classList.remove('filter__select--active')
    })
    selectListItemCountryAll.classList.add('filter__select--active')
    
    // Loại phim
    itemMovieType.forEach(item => {
        item.classList.remove('filter__select--active')
    })
    document.querySelector('.filter__select-list.movie-type [data-type="all"]').classList.add('filter__select--active')
    
    // Thể loại
    itemMovieGenre.forEach(item => {
        item.classList.remove('filter__select--active')
    })
    itemMovieGenreAll.classList.add('filter__select--active')
    
    // Sắp xếp
    itemArrange.forEach(item => {
        item.classList.remove('filter__select--active')
    })
    document.querySelector('.filter__select-list.arrange [data-arrange="new"]').classList.add('filter__select--active')
    
    // Reset filter
    currentMovieType = 'all'
    currentCountry = ''
    currentGenre = []
    currentArrange = 'new'
    currentPage = 1

    updateGenreVisibility('all')
}

// Áp dụng params từ URL
function applyUrlParams() {
    const params = getUrlParams()

    resetFiltersToDefault()
    
    // Set loại phim (movie/tv/all)
    if(params.type) {
        currentMovieType = params.type

        itemMovieType.forEach(item => {
            item.classList.remove('filter__select--active')
        })

        const targetType = document.querySelector(`.filter__select-list.movie-type [data-type="${params.type}"]`)
        if(targetType) {
            targetType.classList.add('filter__select--active')
        }

        updateGenreVisibility(params.type)
    }
    
    // Set thể loại
    if(params.genre) {
        currentGenre = [params.genre]

        itemMovieGenreAll.classList.remove('filter__select--active')

        const targetGenre = document.querySelector(`.filter__select-list.movie-genre [data-genre="${params.genre}"]`)
        if(targetGenre) {
            targetGenre.classList.add('filter__select--active')
        }
    }
    
    // Set quốc gia
    if(params.country) {
        currentCountry = params.country

        selectListItemCountryAll.classList.remove('filter__select--active')

        const targetCountry = document.querySelector(`.filter__select-list.country [data-country="${params.country}"]`)
        if(targetCountry) {
            targetCountry.classList.add('filter__select--active')
        }
    }
}

// Load template
async function initApp() {
    try {
        const response = await fetch('../components/MovieCardRender.html')
        movieCardTemplate = await response.text()

        const params = getUrlParams()
        const isFilterNav = params.type === 'all' && !params.genre && !params.country

        if(isFilterNav) {
            filterSelect.classList.remove('hidden')
            faFilter.classList.add('fa-filter-active')
        }

        applyUrlParams()

        await render()
    } catch (error) {
        console.log('Lỗi load template:', error)
    }
}

initApp()

// Render phim
async function render() {
    if(currentMovieType === 'all') {
        await renderBothMovieAndTV()
    } else {
        await renderOneType()
    }
}

// Render 1 loại
async function renderOneType() {
    try {
        const apiUrl = createApiUrl(currentMovieType, currentPage)
        
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        const movieList = data.results
        totalPages = Math.min(data.total_pages, 100)
        updatePageNumber()
        displayMovies(movieList, currentMovieType)
    } catch (error) {
        console.log('Lỗi:', error)
    }
}

// Render 2 loại
async function renderBothMovieAndTV() {
    try {
        const movieApiUrl = createApiUrl('movie', currentPage)
        const tvApiUrl = createApiUrl('tv', currentPage)

        const [movieResponse, tvResponse] = await Promise.all([
            fetch(movieApiUrl),
            fetch(tvApiUrl)
        ])
        
        const movieData = await movieResponse.json()
        const tvData = await tvResponse.json()
        
        const allMovies = []
        
        // Lấy 10 phim lẻ
        for(let i = 0; i < Math.min(10, movieData.results.length); i++) {
            allMovies.push({
                ...movieData.results[i],
                movieType: 'movie'
            })
        }
        
        // Lấy 10 phim bộ
        for(let i = 0; i < Math.min(10, tvData.results.length); i++) {
            allMovies.push({
                ...tvData.results[i],
                movieType: 'tv'
            })
        }
        
        const maxPages = Math.max(movieData.total_pages, tvData.total_pages)
        totalPages = Math.min(maxPages, 100)

        updatePageNumber()
        displayMovies(allMovies, 'all')
    } catch (error) {
        console.log('Lỗi:', error)
    }
}

// Tạo API
function createApiUrl(type, page) {
    let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`
    
    if(currentGenre.length > 0) {
        url += `&with_genres=${currentGenre.join(',')}`
    }
    
    if(currentCountry) {
        url += `&with_origin_country=${currentCountry}`
    }

    if(currentArrange === 'new') {
        if(type === 'movie') {
            url += '&sort_by=release_date.desc'
        } else {
            url += '&sort_by=first_air_date.desc'
        }
    } else if(currentArrange === 'imdb') {
        url += '&sort_by=vote_average.desc&vote_count.gte=100'
    } else if(currentArrange === 'popular') {
        url += '&sort_by=popularity.desc'
    }
    
    return url
}

// Movie-card-render
function displayMovies(movieList, type) {
    let html = ''
    
    for(let i = 0; i < movieList.length; i++) {
        const movie = movieList[i]
        
        let isMovie = false
        if(type === 'all') {
            isMovie = (movie.movieType === 'movie')
        } else {
            isMovie = (type === 'movie')
        }
        
        const movieId = movie.id
        const movieName = isMovie ? movie.title : movie.name
        const originalName = isMovie ? movie.original_title : movie.original_name
        const posterPath = IMAGE_URL + movie.poster_path
        
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
    
    movieContainer.innerHTML = html
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updatePageNumber() {
    pageTotalSpan.textContent = `/ ${totalPages}`
    updatePaginationButtons()
}

// Lọc phim
filterBtn.addEventListener('click', async () => {
    // Quốc gia
    const selectedCountry = document.querySelector('.filter__select-list.country .filter__select--active')
    const countryCode = selectedCountry.getAttribute('data-country')
    currentCountry = countryCode === 'all' ? '' : countryCode
    
    // Loại phim
    const selectedType = document.querySelector('.filter__select-list.movie-type .filter__select--active')
    currentMovieType = selectedType.getAttribute('data-type')
    
    // Thể loại
    const selectedGenres = document.querySelectorAll('.filter__select-list.movie-genre .filter__select--active')
    currentGenre = []
    selectedGenres.forEach(item => {
        const genreId = item.getAttribute('data-genre')
        if(genreId !== 'all') {
            currentGenre.push(genreId)
        }
    })
    
    // Sắp xếp
    const selectedArrange = document.querySelector('.filter__select-list.arrange .filter__select--active')
    currentArrange = selectedArrange.getAttribute('data-arrange')
    
    // Reset về trang 1
    currentPage = 1
    pageCurrentSpan.textContent = '1'
    
    // Đóng bộ lọc
    filterSelect.classList.add('hidden')
    faFilter.classList.remove('fa-filter-active')

    await render()
})

// Phân trang
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

rightPag.addEventListener('click', async () => {
    if(currentPage < totalPages) {
        currentPage++
        pageCurrentSpan.textContent = currentPage
        await render()
    }
})

leftPag.addEventListener('click', async () => {
    if(currentPage > 1) {
        currentPage--
        pageCurrentSpan.textContent = currentPage
        await render()
    }
})