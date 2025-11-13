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
    const modalMovie = document.querySelector('.modal-movie');
    const backdrop = document.querySelector('.modal-movie .modal_backdrop');
    const movieFormEl = document.querySelector('.form-wrapper.movie-form form');
    const modalTitle = document.querySelector('.modal-title');
    const submitBtn = movieFormEl.querySelector('.btn.btn-primary');
    
    // Table & Pagination
    const tableBody = document.querySelector('.dm-table-body');
    const movieCountHeading = document.querySelector('.dm-table-heading h2');
    const currentPageSpan = document.querySelector('.pagination-page-current');
    const totalPagesSpan = document.querySelector('.pagination__main span:last-child');
    const paginationLeft = document.querySelector('.pagination-left-arrow');
    const paginationRight = document.querySelector('.pagination-right-arrow');
    
    // Search & Filter
    const searchInput = document.querySelector('.search-input');
    const countryFilter = document.querySelector('.filter-select:nth-child(1)');
    const statusFilter = document.querySelector('.filter-select:nth-child(2)');
    const ratingFilter = document.querySelector('.filter-select:nth-child(3)');
    
    // Media inputs
    const mediaPreview = document.querySelector('.movie-media-right');
    const bannerPreviewImg = mediaPreview.querySelector('.banner-preview img');
    const posterPreviewImg = mediaPreview.querySelector('.poster-preview img');
    const bannerInput = mediaPreview.querySelector('.banner-input');
    const posterInput = mediaPreview.querySelector('.poster-input');

    // Sub-modal (Actors)
    const subModal = document.getElementById('actors-sub-modal');
    const subModalBackdrop = document.getElementById('actors-backdrop');
    const actorsListEl = document.getElementById('actors-list');

    // Templates
    const actorTemplate = document.getElementById('actor-item-template');
    const emptyRowTemplate = document.getElementById('empty-row-template');
    const emptyActorsTemplate = document.getElementById('empty-actors-template');

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
            <td>${no}</td>
            <td>
                <div class="movie-title">
                    <div class="movie-poster">
                        <img src="${movie.poster}" alt="${movie.title}">
                    </div>
                    <div class="movie-title">
                        <span>${movie.title}</span>
                    </div>
                </div>
            </td>
            <td>${movie.genre}</td>
            <td>${durationText}</td>
            <td>${ratingHTML}</td>
            <td>
                <span style="color: ${statusColor}; font-weight: 600;">
                    ${movie.status}
                </span>
            </td>
            <td><button class="btn btn-edit"><i class="fa-solid fa-pen"></i></button></td>
            <td><button class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></button></td>
            <td><button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button></td>
        `;

        row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(row));
        row.querySelector('.btn-delete').addEventListener('click', () => {
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
        const actorDiv = actorItem.querySelector('.actor-item');
        
        // Set data
        const header = actorDiv.querySelector('.actor-header');
        const body = actorDiv.querySelector('.actor-body');
        const titleEl = actorDiv.querySelector('.actor-title');
        const idInput = actorDiv.querySelector('.actor-id');
        const nameInput = actorDiv.querySelector('.actor-name');
        const photoImg = actorDiv.querySelector('.actor-photo-img');
        const photoInput = actorDiv.querySelector('.actor-photo-input');
        const deleteBtn = actorDiv.querySelector('.delete-actor-btn');
        
        titleEl.textContent = actor.name || `Actor ${index + 1}`;
        idInput.value = actor.id || '';
        nameInput.value = actor.name || '';
        photoImg.src = actor.photo || '../../public/assets/image/user_avatar_default.jpg';
        
        // Toggle hiển thị
        header.addEventListener('click', (e) => {
            if (e.target.closest('.delete-actor-btn')) return;
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
        
        const idDisplayGroup = movieFormEl.querySelector('.movie-id-display');
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        
        modalMovie.classList.remove('hidden');
        document.querySelector('.form-wrapper.movie-form').classList.add('active');
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
        
        const idDisplayGroup = movieFormEl.querySelector('.movie-id-display');
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
        document.querySelector('.form-wrapper.movie-form').classList.add('active');
    };

    // Đóng modal
    const closeModal = () => {
        modalMovie.classList.add('hidden');
        document.querySelector('.form-wrapper.movie-form').classList.remove('active');
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
    document.querySelector('.add-btn').addEventListener('click', openAddModal);
    backdrop.addEventListener('click', closeModal);
    document.querySelector('.modal-movie .modal_close').addEventListener('click', closeModal);
    
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
    movieFormEl.querySelector('.manage-actors-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openActorsModal();
    });
    
    subModal?.querySelector('.add-actor-btn')?.addEventListener('click', () => {
        const movieId = movieFormEl.querySelector('input[name="id"]').value || generateMovieId();
        const newActorId = generateActorId(movieId);
        
        currentActors.push({
            id: newActorId,
            name: '',
            photo: '../../public/assets/image/user_avatar_default.jpg'
        });
        renderActorsList();
    });
    
    subModal?.querySelector('.save-actors-btn')?.addEventListener('click', closeActorsModal);
    subModal?.querySelector('.sub-close')?.addEventListener('click', closeActorsModal);
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