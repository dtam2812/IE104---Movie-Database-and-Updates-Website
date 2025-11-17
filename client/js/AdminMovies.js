export async function AdminMovies_js() {

    // Load dữ liệu movies từ file Data.js 
    let allMovies = [];
    try {
        const { moviesData } = await import('./Data.js');
        allMovies = moviesData ? [...moviesData] : [];
    } catch {
        console.log('No initial movie data, starting empty');
    }

    // DOM ELEMENTS
    // Modal elements
    const modalMovie = document.querySelector('.modal--movie');
    const backdrop = document.querySelector('.modal--movie .modal__backdrop');
    const movieFormEl = document.querySelector('.form--movie form');
    const modalTitle = document.querySelector('.form__title');
    const submitBtn = movieFormEl.querySelector('.form__btn--primary');
    
    // Table & Pagination
    const tableBody = document.querySelector('.data-table__body');
    const movieCountHeading = document.querySelector('.data-table__title');
    const currentPageSpan = document.querySelector('.pagination__current');
    const totalPagesSpan = document.querySelector('.pagination__info span:last-child');
    const paginationLeft = document.querySelector('.pagination__arrow--left');
    const paginationRight = document.querySelector('.pagination__arrow--right');
    
    // Search & Filter
    const searchInput = document.querySelector('.search-filter__input');
    const countryFilter = document.querySelector('.search-filter__select:nth-child(1)');
    const statusFilter = document.querySelector('.search-filter__select:nth-child(2)');
    const ratingFilter = document.querySelector('.search-filter__select:nth-child(3)');
    
    // Media inputs
    const mediaPreview = document.querySelector('.media-form__media');
    const bannerPreviewImg = mediaPreview.querySelector('.media-form__banner img');
    const posterPreviewImg = mediaPreview.querySelector('.media-form__poster img');
    const bannerInput = mediaPreview.querySelector('.media-form__banner-input');
    const posterInput = mediaPreview.querySelector('.media-form__poster-input');

    // Sub-modal (Actors)
    const subModal = document.getElementById('actors-sub-modal');
    const subModalBackdrop = document.getElementById('actors-backdrop');
    const actorsListEl = document.getElementById('actors-list');

    // Templates
    const actorTemplate = document.getElementById('actor-item-template');
    const emptyRowTemplate = document.getElementById('empty-row-template');
    const emptyActorsTemplate = document.getElementById('empty-actors-template');

    
    // SIGN OUT FUNCTIONALITY
    const signOutLink = document.querySelector('.admin-menu__item:last-child .admin-menu__link');
    if (signOutLink) {
        signOutLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            console.log("Admin signing out");

            // Xóa tất cả thông tin user khỏi localStorage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("refreshToken");

            // Redirect về trang HomePage
            window.location.href = "/client/view/pages/HomePage.html";
        });
    }

    // STATE MANAGEMENT 
    let filteredMovies = [...allMovies];
    let currentActors = [];
    let currentPage = 1;
    let currentEditRow = null;
    let isEditMode = false;
    const moviesPerPage = 5;
    
    // Tạo ID tự động theo format MV001, MV002, ...
    const generateMovieId = () => {
        if (allMovies.length === 0) return 'MV001';
        
        const maxNum = allMovies.reduce((max, movie) => {
            const match = movie.id.match(/^MV(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return 'MV' + String(maxNum + 1).padStart(3, '0');
    };

    // Tạo ID cho actor theo format MV001-AC001, MV001-AC002, ...
    const generateActorId = (movieId) => {
        if (currentActors.length === 0) return `${movieId}-AC001`;
        
        const maxNum = currentActors.reduce((max, actor) => {
            const match = actor.id.match(/AC(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return `${movieId}-AC` + String(maxNum + 1).padStart(3, '0');
    };

    // Tính tổng số trang
    const getTotalPages = () => Math.ceil(filteredMovies.length / moviesPerPage);

    // Lấy danh sách movies cho trang hiện tại
    const getMoviesForCurrentPage = () => {
        const start = (currentPage - 1) * moviesPerPage;
        return filteredMovies.slice(start, start + moviesPerPage);
    };

    // Đọc file ảnh thành base64
    const readFileAsDataURL = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    };

    // FILTER & SEARCH 
    // Lọc movies theo search và filter
    const filterMovies = () => {
        const search = searchInput.value.toLowerCase().trim();
        const country = countryFilter.value;
        const status = statusFilter.value;
        const rating = ratingFilter.value;

        filteredMovies = allMovies.filter(movie => {
            const matchSearch = movie.title.toLowerCase().includes(search) || 
                              movie.id.toLowerCase().includes(search);
            const matchCountry = country === 'all' || movie.country === country;
            const matchStatus = status === 'all' || movie.status === status;
            const matchRating = rating === 'all' || movie.rating >= parseFloat(rating);

            return matchSearch && matchCountry && matchStatus && matchRating;
        });

        const totalPages = getTotalPages();
        currentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
        
        renderMovies();
    };

    // RENDER FUNCTIONS
    // Tạo một row trong bảng movies
    const createMovieRow = (movie, no) => {
        const durationText = movie.duration > 0 ? `${movie.duration} min` : 'N/A';
        const ratingHTML = movie.rating > 0 
            ? `<span>${movie.rating}</span>` 
            : '<span style="color: #717182;">N/A</span>';
        const statusColor = movie.status === 'Released' ? '#4CAF50' : '#ff9800';

        const row = document.createElement('tr');
        row.dataset.movieId = movie.id;
        row.innerHTML = `
            <td class ="data-table__th">${no}</td>
            <td class ="data-table__th">
                <div class="movie-cell">
                    <div class="movie-cell__poster">
                        <img class="movie-cell__image" src="${movie.poster}" alt="${movie.title}">
                    </div>
                    <div class="movie-cell__title">
                        <span>${movie.title}</span>
                    </div>
                </div>
            </td>
            <td class ="data-table__th">${movie.genre}</td>
            <td class ="data-table__th">${durationText}</td>
            <td class ="data-table__th">${ratingHTML}</td>
            <td class ="data-table__th">
                <span style="color: ${statusColor}; font-weight: 600;">
                    ${movie.status}
                </span>
            </td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--edit"><i class="fa-solid fa-pen"></i></button></td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--detail"><i class="fa-solid fa-circle-info"></i></button></td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--delete"><i class="fa-solid fa-trash"></i></button></td>
        `;

        row.querySelector('.data-table__btn--edit').addEventListener('click', () => openEditModal(row));
        row.querySelector('.data-table__btn--delete').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${movie.title}"?`)) {
                allMovies = allMovies.filter(m => m.id !== movie.id);
                filterMovies();
            }
        });

        return row;
    };

    // Render toàn bộ bảng movies
    const renderMovies = () => {
        const moviesToShow = getMoviesForCurrentPage();
        const startNo = (currentPage - 1) * moviesPerPage + 1;

        tableBody.innerHTML = '';
        
        if (moviesToShow.length === 0) {
            tableBody.appendChild(emptyRowTemplate.content.cloneNode(true));
        } else {
            moviesToShow.forEach((movie, i) => {
                tableBody.appendChild(createMovieRow(movie, startNo + i));
            });
        }

        updateMovieCount();
        updatePaginationButtons();
    };

    // Cập nhật số lượng movies hiển thị
    const updateMovieCount = () => {
        movieCountHeading.textContent = filteredMovies.length === allMovies.length
            ? `Movies (${allMovies.length})`
            : `Movies (${filteredMovies.length} / ${allMovies.length})`;
    };

    // Cập nhật trạng thái các nút phân trang
    const updatePaginationButtons = () => {
        const totalPages = getTotalPages();
        
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = `/ ${totalPages}`;
        
        paginationLeft.classList.toggle('disable', currentPage === 1 || totalPages === 0);
        paginationLeft.disabled = currentPage === 1 || totalPages === 0;
        
        paginationRight.classList.toggle('disable', currentPage >= totalPages || totalPages === 0);
        paginationRight.disabled = currentPage >= totalPages || totalPages === 0;
    };

    // ACTORS SUB-MODAL 
    // Tạo actor item từ template
    const createActorItem = (actor, index) => {
        const actorItem = actorTemplate.content.cloneNode(true);
        const actorDiv = actorItem.querySelector('.actor');
        
        // Set data
        const header = actorDiv.querySelector('.actor__header');
        const body = actorDiv.querySelector('.actor__body');
        const titleEl = actorDiv.querySelector('.actor__title');
        const idInput = actorDiv.querySelector('.actor__id');
        const nameInput = actorDiv.querySelector('.actor__name');
        const photoImg = actorDiv.querySelector('.actor__photo-image');
        const photoInput = actorDiv.querySelector('.actor__photo-input');
        const deleteBtn = actorDiv.querySelector('.actor__delete-btn');
        
        titleEl.textContent = actor.name || `Actor ${index + 1}`;
        idInput.value = actor.id || '';
        nameInput.value = actor.name || '';
        photoImg.src = actor.photo || '../../public/assets/image/user_avatar_default.jpg';
        
        // Toggle hiển thị
        header.addEventListener('click', (e) => {
            if (e.target.closest('.actor__delete-btn')) return;
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        
        // Xóa actor
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this actor?')) {
                currentActors.splice(index, 1);
                renderActorsList();
            }
        });
        
        // Upload photo
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                photoImg.src = await readFileAsDataURL(file);
                currentActors[index].photo = photoImg.src;
            }
        });
        
        // Update name
        nameInput.addEventListener('input', (e) => {
            titleEl.textContent = e.target.value || `Actor ${index + 1}`;
            currentActors[index].name = e.target.value;
        });
        
        return actorItem;
    };

    // Render danh sách actors trong sub-modal
    const renderActorsList = () => {
        if (!actorsListEl) return;

        actorsListEl.innerHTML = '';
        
        if (currentActors.length === 0) {
            actorsListEl.appendChild(emptyActorsTemplate.content.cloneNode(true));
            return;
        }
        
        currentActors.forEach((actor, i) => {
            actorsListEl.appendChild(createActorItem(actor, i));
        });
    };

    // Mở sub-modal quản lý actors
    const openActorsModal = () => {
        if (!subModal || !subModalBackdrop) return;
        renderActorsList();
        subModal.classList.remove('hidden');
        subModalBackdrop.classList.remove('hidden');
    };

    // Đóng sub-modal và cập nhật dữ liệu
    const closeActorsModal = () => {
        if (!subModal || !subModalBackdrop) return;

        // Cập nhật số actors vào form chính
        const actorNames = currentActors.map(a => a.name).filter(Boolean).join(', ');
        movieFormEl.querySelector('input[name="actors"]').value = actorNames || '';
        movieFormEl.querySelector('input[name="actorsCount"]').value = currentActors.length;

        subModal.classList.add('hidden');
        subModalBackdrop.classList.add('hidden');
    };

    // MODAL ADD/EDIT 
    // Mở modal thêm movie mới
    const openAddModal = () => {
        isEditMode = false;
        modalTitle.textContent = 'Add Movie';
        submitBtn.textContent = 'Create';
        
        movieFormEl.reset();
        bannerPreviewImg.src = '../../public/assets/image/movie_banner_default.png';
        posterPreviewImg.src = '../../public/assets/image/0891b2.svg';
        
        currentActors = [];
        movieFormEl.querySelector('input[name="actorsCount"]').value = '0';
        
        const idDisplayGroup = movieFormEl.querySelector('.media-form__id-display');
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        
        modalMovie.classList.remove('hidden');
        document.querySelector('.form--movie').classList.add('form--active');
    };

    // Mở modal chỉnh sửa movie
    const openEditModal = (row) => {
        isEditMode = true;
        currentEditRow = row;
        
        const movie = allMovies.find(m => m.id === row.dataset.movieId);
        if (!movie) return;
        
        modalTitle.textContent = 'Edit Movie';
        submitBtn.textContent = 'Save';
        
        bannerPreviewImg.src = movie.banner;
        posterPreviewImg.src = movie.poster;
        
        const idDisplayGroup = movieFormEl.querySelector('.media-form__id-display');
        const idDisplayInput = movieFormEl.querySelector('input[name="id-display"]');
        if (idDisplayGroup && idDisplayInput) {
            idDisplayGroup.style.display = 'block';
            idDisplayInput.value = movie.id;
        }
        
        // Điền dữ liệu vào form
        const fields = {
            id: movie.id,
            title: movie.title,
            overview: movie.overview || '',
            genre: movie.genre,
            duration: movie.duration || '',
            country: movie.country,
            director: movie.director || '',
            producer: movie.producer || '',
            budget: movie.budget || '',
            revenue: movie.revenue || '',
            trailer: movie.trailer || '',
            rating: movie.rating || '',
            status: movie.status
        };
        
        Object.entries(fields).forEach(([name, value]) => {
            const el = movieFormEl.querySelector(`[name="${name}"]`);
            if (el) el.value = value;
        });
        
        currentActors = Array.isArray(movie.actorsData) 
            ? JSON.parse(JSON.stringify(movie.actorsData)) 
            : [];
        
        const actorNames = currentActors.map(a => a.name).filter(Boolean).join(', ');
        movieFormEl.querySelector('input[name="actors"]').value = actorNames || '';
        movieFormEl.querySelector('input[name="actorsCount"]').value = currentActors.length;
        
        modalMovie.classList.remove('hidden');
        document.querySelector('.form--movie').classList.add('form--active');
    };

    // Đóng modal
    const closeModal = () => {
        modalMovie.classList.add('hidden');
        document.querySelector('.form--movie').classList.remove('form--active');
        movieFormEl.reset();
        currentEditRow = null;
        isEditMode = false;
        currentActors = [];
        bannerInput.value = '';
        posterInput.value = '';
    };

    // EVENT LISTENERS 
    // Search & Filter
    searchInput.addEventListener('input', filterMovies);
    countryFilter.addEventListener('change', filterMovies);
    statusFilter.addEventListener('change', filterMovies);
    ratingFilter.addEventListener('change', filterMovies);

    // Pagination
    paginationLeft.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderMovies();
        }
    });
    
    paginationRight.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderMovies();
        }
    });

    // Modal
    document.querySelector('.admin-content__add-btn').addEventListener('click', openAddModal);
    backdrop.addEventListener('click', closeModal);
    document.querySelector('.modal--movie .modal__close').addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalMovie.classList.contains('hidden')) {
            if (!subModal || subModal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });

    // Upload ảnh
    bannerInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) bannerPreviewImg.src = await readFileAsDataURL(file);
    });

    posterInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) posterPreviewImg.src = await readFileAsDataURL(file);
    });

    // Sub-modal actors
    movieFormEl.querySelector('.form__manage-btn--actors')?.addEventListener('click', (e) => {
        e.preventDefault();
        openActorsModal();
    });
    
    subModal?.querySelector('.sub-modal__add-btn')?.addEventListener('click', () => {
        const movieId = movieFormEl.querySelector('input[name="id"]').value || generateMovieId();
        const newActorId = generateActorId(movieId);
        
        currentActors.push({
            id: newActorId,
            name: '',
            photo: '../../public/assets/image/user_avatar_default.jpg'
        });
        renderActorsList();
    });
    
    subModal?.querySelector('.sub-modal__save-btn')?.addEventListener('click', closeActorsModal);
    subModal?.querySelector('.sub-modal__close')?.addEventListener('click', closeActorsModal);
    subModalBackdrop?.addEventListener('click', closeActorsModal);

    // Submit form
    movieFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const getData = (name) => {
            const el = movieFormEl.querySelector(`[name="${name}"]`);
            return el ? el.value : '';
        };
        
        const movieData = {
            title: getData('title'),
            overview: getData('overview'),
            genre: getData('genre'),
            duration: parseInt(getData('duration')) || 0,
            country: getData('country'),
            director: getData('director'),
            actorsData: currentActors,
            producer: getData('producer'),
            budget: parseInt(getData('budget')) || 0,
            revenue: parseInt(getData('revenue')) || 0,
            trailer: getData('trailer'),
            rating: parseFloat(getData('rating')) || 0,
            status: getData('status')
        };

        const bannerFile = bannerInput.files[0];
        const posterFile = posterInput.files[0];
        
        movieData.banner = bannerFile ? await readFileAsDataURL(bannerFile) : bannerPreviewImg.src;
        movieData.poster = posterFile ? await readFileAsDataURL(posterFile) : posterPreviewImg.src;

        if (isEditMode && currentEditRow) {
            const movieId = currentEditRow.dataset.movieId;
            const index = allMovies.findIndex(m => m.id === movieId);
            
            if (index !== -1) {
                allMovies[index] = { ...allMovies[index], ...movieData };
                filterMovies();
            }
        } else {
            movieData.id = generateMovieId();
            
            currentActors.forEach((actor, i) => {
                actor.id = `${movieData.id}-AC${String(i + 1).padStart(3, '0')}`;
            });
            movieData.actorsData = currentActors;
            
            allMovies.push(movieData);
            filterMovies();
            
            currentPage = getTotalPages();
            renderMovies();
        }
        
        closeModal();
    });

    renderMovies();
}