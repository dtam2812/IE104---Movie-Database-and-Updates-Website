export async function AdminTVShows_js() {
    let tvShowsData = [];
    try {
        const module = await import('./Data.js');
        tvShowsData = module.tvShowsData || [];
        console.log('✅ Loaded TV shows data');
    } catch {
        console.log('ℹ️ No initial TV show data, starting empty');
    }

    // DOM ELEMENTS 
    // Modal elements
    const modalTV = document.querySelector('.modal-tvshow');
    const backdrop = document.querySelector('.modal-tvshow .modal_backdrop');
    const tvFormEl = document.querySelector('.form-wrapper.tvshow-form form');
    const modalTitle = document.querySelector('.modal-title');
    const submitBtn = tvFormEl.querySelector('.btn.btn-primary');
    
    // Table & Pagination
    const tableBody = document.querySelector('.dm-table-body');
    const tvCountHeading = document.querySelector('.dm-table-heading h2');
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
    const mediaPreview = document.querySelector('.tvshow-media-right');
    const bannerPreviewImg = mediaPreview.querySelector('.banner-preview img');
    const posterPreviewImg = mediaPreview.querySelector('.poster-preview img');
    const bannerInput = mediaPreview.querySelector('.banner-input');
    const posterInput = mediaPreview.querySelector('.poster-input');

    // Sub-modal (Seasons)
    const subModal = document.getElementById('seasons-sub-modal');
    const subModalBackdrop = document.getElementById('seasons-backdrop');
    const seasonsListEl = document.getElementById('seasons-list');

    // Sub-modal (Actors)
    const actorsSubModal = document.getElementById('actors-sub-modal');
    const actorsSubModalBackdrop = document.getElementById('actors-backdrop');
    const actorsListEl = document.getElementById('actors-list');

    // Templates
    const seasonTemplate = document.getElementById('season-item-template');
    const actorTemplate = document.getElementById('actor-item-template');
    const emptyRowTemplate = document.getElementById('empty-row-template');
    const emptySeasonsTemplate = document.getElementById('empty-seasons-template');
    const emptyActorsTemplate = document.getElementById('empty-actors-template');

    // ========== STATE MANAGEMENT ==========
    let allTVShows = [...tvShowsData];
    let filteredTVShows = [...allTVShows];
    let currentSeasons = [];
    let currentActors = [];
    let currentPage = 1;
    let currentEditRow = null;
    let isEditMode = false;
    const tvPerPage = 5;
    
    // Tạo ID tự động theo format TV001, TV002, ...
    const generateTVId = () => {
        if (allTVShows.length === 0) return 'TV001';
        
        const maxNum = allTVShows.reduce((max, show) => {
            const match = show.id.match(/^TV(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return 'TV' + String(maxNum + 1).padStart(3, '0');
    };

    // Tạo ID cho actor theo format TV001-AC001, TV001-AC002, ...
    const generateActorId = (tvId) => {
        if (currentActors.length === 0) return `${tvId}-AC001`;
        
        const maxNum = currentActors.reduce((max, actor) => {
            const match = actor.id.match(/AC(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return `${tvId}-AC` + String(maxNum + 1).padStart(3, '0');
    };

    // Tính tổng số trang
    const getTotalPages = () => Math.ceil(filteredTVShows.length / tvPerPage);

    // Lấy danh sách TV shows cho trang hiện tại
    const getTVShowsForCurrentPage = () => {
        const start = (currentPage - 1) * tvPerPage;
        return filteredTVShows.slice(start, start + tvPerPage);
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
    // Lọc TV shows theo search và filter
    const filterTVShows = () => {
        const search = searchInput.value.toLowerCase().trim();
        const country = countryFilter.value;
        const status = statusFilter.value;
        const rating = ratingFilter.value;

        filteredTVShows = allTVShows.filter(show => {
            const matchSearch = show.title.toLowerCase().includes(search) ||
                              show.id.toLowerCase().includes(search);
            const matchCountry = country === 'all' || show.country === country;
            const matchStatus = status === 'all' || show.status === status;
            const matchRating = rating === 'all' || show.rating >= parseFloat(rating);

            return matchSearch && matchCountry && matchStatus && matchRating;
        });

        const totalPages = getTotalPages();
        currentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
        
        renderTVShows();
    };

    // RENDER FUNCTIONS 
    // Tạo một row trong bảng TV shows
    const createTVRow = (show, no) => {
        const seasonsCount = Array.isArray(show.seasonsData) ? show.seasonsData.length : 0;
        const seasonsText = seasonsCount > 0 ? `${seasonsCount} season${seasonsCount > 1 ? 's' : ''}` : 'N/A';
        const ratingHTML = show.rating > 0 
            ? `<span>${show.rating}</span>` 
            : '<span style="color: #717182;">N/A</span>';
        const statusColor = show.status === 'Released' ? '#4CAF50' : '#ff9800';

        const row = document.createElement('tr');
        row.dataset.tvId = show.id;
        row.innerHTML = `
            <td>${no}</td>
            <td>
                <div class="movie-title">
                    <div class="movie-poster">
                        <img src="${show.poster}" alt="${show.title}">
                    </div>
                    <div class="movie-title">
                        <span>${show.title}</span>
                    </div>
                </div>
            </td>
            <td>${show.genre}</td>
            <td>${seasonsText}</td>
            <td>${ratingHTML}</td>
            <td>
                <span style="color: ${statusColor}; font-weight: 600;">
                    ${show.status}
                </span>
            </td>
            <td><button class="btn btn-edit"><i class="fa-solid fa-pen"></i></button></td>
            <td><button class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></button></td>
            <td><button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button></td>
        `;

        row.querySelector('.btn-edit').addEventListener('click', () => openEditTVModal(row));
        row.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${show.title}"?`)) {
                allTVShows = allTVShows.filter(s => s.id !== show.id);
                filterTVShows();
            }
        });

        return row;
    };

    // Render toàn bộ bảng TV shows
    const renderTVShows = () => {
        const tvToShow = getTVShowsForCurrentPage();
        const startNo = (currentPage - 1) * tvPerPage + 1;

        tableBody.innerHTML = '';
        
        if (tvToShow.length === 0) {
            tableBody.appendChild(emptyRowTemplate.content.cloneNode(true));
        } else {
            tvToShow.forEach((show, i) => {
                tableBody.appendChild(createTVRow(show, startNo + i));
            });
        }

        updateTVCount();
        updatePaginationButtons();
    };

    // Cập nhật số lượng TV shows hiển thị
    const updateTVCount = () => {
        tvCountHeading.textContent = filteredTVShows.length === allTVShows.length
            ? `TV Shows (${allTVShows.length})`
            : `TV Shows (${filteredTVShows.length} / ${allTVShows.length})`;
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

    // SEASONS SUB-MODAL 
    // Tạo season item từ template
    const createSeasonItem = (season, index) => {
        const seasonItem = seasonTemplate.content.cloneNode(true);
        const seasonDiv = seasonItem.querySelector('.season-item');
        
        // Set data
        const header = seasonDiv.querySelector('.season-header');
        const body = seasonDiv.querySelector('.season-body');
        const titleEl = seasonDiv.querySelector('.season-title');
        const titleInput = seasonDiv.querySelector('.season-title-input');
        const episodesInput = seasonDiv.querySelector('.season-episodes');
        const overviewInput = seasonDiv.querySelector('.season-overview');
        const posterImg = seasonDiv.querySelector('.season-poster-img');
        const posterInput = seasonDiv.querySelector('.season-poster-input');
        const deleteBtn = seasonDiv.querySelector('.delete-season-btn');
        
        titleEl.textContent = season.title || `Season ${index + 1}`;
        titleInput.value = season.title || '';
        episodesInput.value = season.episodes || '';
        overviewInput.value = season.overview || '';
        posterImg.src = season.poster || '../../public/assets/image/movie_poster_default.jpg';
        
        // Toggle hiển thị
        header.addEventListener('click', (e) => {
            if (e.target.closest('.delete-season-btn')) return;
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        
        // Xóa season
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this season?')) {
                currentSeasons.splice(index, 1);
                renderSeasonsList();
            }
        });
        
        // Upload poster
        posterInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                posterImg.src = await readFileAsDataURL(file);
                currentSeasons[index].poster = posterImg.src;
            }
        });
        
        // Update title
        titleInput.addEventListener('input', (e) => {
            titleEl.textContent = e.target.value || `Season ${index + 1}`;
            currentSeasons[index].title = e.target.value;
        });
        
        // Update episodes
        episodesInput.addEventListener('input', (e) => {
            currentSeasons[index].episodes = parseInt(e.target.value) || 0;
        });
        
        // Update overview
        overviewInput.addEventListener('input', (e) => {
            currentSeasons[index].overview = e.target.value;
        });
        
        return seasonItem;
    };

    // Render danh sách seasons trong sub-modal
    const renderSeasonsList = () => {
        if (!seasonsListEl) return;

        seasonsListEl.innerHTML = '';
        
        if (currentSeasons.length === 0) {
            seasonsListEl.appendChild(emptySeasonsTemplate.content.cloneNode(true));
            return;
        }
        
        currentSeasons.forEach((season, i) => {
            seasonsListEl.appendChild(createSeasonItem(season, i));
        });
    };

    // Mở sub-modal quản lý seasons
    const openSeasonsModal = () => {
        if (!subModal || !subModalBackdrop) return;
        renderSeasonsList();
        subModal.classList.remove('hidden');
        subModalBackdrop.classList.remove('hidden');
    };

    // Đóng sub-modal và cập nhật dữ liệu
    const closeSeasonsModal = () => {
        if (!subModal || !subModalBackdrop) return;

        // Cập nhật số seasons và tổng episodes vào form chính
        tvFormEl.querySelector('input[name="seasons"]').value = currentSeasons.length;
        const totalEps = currentSeasons.reduce((sum, s) => sum + (parseInt(s.episodes) || 0), 0);
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = totalEps;

        subModal.classList.add('hidden');
        subModalBackdrop.classList.add('hidden');
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
        if (!actorsSubModal || !actorsSubModalBackdrop) return;
        renderActorsList();
        actorsSubModal.classList.remove('hidden');
        actorsSubModalBackdrop.classList.remove('hidden');
    };

    // Đóng sub-modal và cập nhật dữ liệu
    const closeActorsModal = () => {
        if (!actorsSubModal || !actorsSubModalBackdrop) return;

        // Cập nhật số actors vào form chính
        const actorNames = currentActors.map(a => a.name).filter(Boolean).join(', ');
        tvFormEl.querySelector('input[name="actors"]').value = actorNames || '';
        tvFormEl.querySelector('input[name="actorsCount"]').value = currentActors.length;

        actorsSubModal.classList.add('hidden');
        actorsSubModalBackdrop.classList.add('hidden');
    };

    // MODAL ADD/EDIT TV SHOW 
    // Mở modal thêm TV show mới
    const openAddTVModal = () => {
        isEditMode = false;
        modalTitle.textContent = 'Add TV Show';
        submitBtn.textContent = 'Create';
        
        tvFormEl.reset();
        bannerPreviewImg.src = '../../public/assets/image/movie_banner_default.jpg';
        posterPreviewImg.src = '../../public/assets/image/movie_poster_default.jpg';
        
        currentSeasons = [];
        currentActors = [];
        tvFormEl.querySelector('input[name="seasons"]').value = '0';
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = '0';
        tvFormEl.querySelector('input[name="actorsCount"]').value = '0';
        
        const idDisplayGroup = tvFormEl.querySelector('.tvshow-id-display');
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        
        modalTV.classList.remove('hidden');
        document.querySelector('.form-wrapper.tvshow-form').classList.add('active');
    };

    // Mở modal chỉnh sửa TV show
    const openEditTVModal = (row) => {
        isEditMode = true;
        currentEditRow = row;
        
        const show = allTVShows.find(s => s.id === row.dataset.tvId);
        if (!show) return;
        
        modalTitle.textContent = 'Edit TV Show';
        submitBtn.textContent = 'Save';
        
        bannerPreviewImg.src = show.banner;
        posterPreviewImg.src = show.poster;
        
        const idDisplayGroup = tvFormEl.querySelector('.tvshow-id-display');
        const idDisplayInput = tvFormEl.querySelector('input[name="id-display"]');
        if (idDisplayGroup && idDisplayInput) {
            idDisplayGroup.style.display = 'block';
            idDisplayInput.value = show.id;
        }
        
        // Điền dữ liệu vào form
        const fields = {
            id: show.id,
            title: show.title,
            overview: show.overview || '',
            genre: show.genre,
            country: show.country,
            creator: show.creator || '',
            producer: show.producer || '',
            budget: show.budget || '',
            revenue: show.revenue || '',
            trailer: show.trailer || '',
            rating: show.rating || '',
            status: show.status
        };
        
        Object.entries(fields).forEach(([name, value]) => {
            const el = tvFormEl.querySelector(`[name="${name}"]`);
            if (el) el.value = value;
        });
        
        currentSeasons = Array.isArray(show.seasonsData) 
            ? JSON.parse(JSON.stringify(show.seasonsData)) 
            : [];
        
        tvFormEl.querySelector('input[name="seasons"]').value = currentSeasons.length;
        const totalEps = currentSeasons.reduce((sum, s) => sum + (parseInt(s.episodes) || 0), 0);
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = totalEps;
        
        // Load actors data
        currentActors = Array.isArray(show.actorsData) 
            ? JSON.parse(JSON.stringify(show.actorsData)) 
            : [];

        const actorNames = currentActors.map(a => a.name).filter(Boolean).join(', ');
        tvFormEl.querySelector('input[name="actors"]').value = actorNames || '';
        tvFormEl.querySelector('input[name="actorsCount"]').value = currentActors.length;
        
        modalTV.classList.remove('hidden');
        document.querySelector('.form-wrapper.tvshow-form').classList.add('active');
    };

    // Đóng modal chính
    const closeModal = () => {
        modalTV.classList.add('hidden');
        document.querySelector('.form-wrapper.tvshow-form').classList.remove('active');
        tvFormEl.reset();
        currentEditRow = null;
        isEditMode = false;
        currentSeasons = [];
        currentActors = [];
        bannerInput.value = '';
        posterInput.value = '';
    };

    // EVENT LISTENERS
    // Search & Filter
    searchInput.addEventListener('input', filterTVShows);
    countryFilter.addEventListener('change', filterTVShows);
    statusFilter.addEventListener('change', filterTVShows);
    ratingFilter.addEventListener('change', filterTVShows);

    // Pagination
    paginationLeft.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTVShows();
        }
    });
    
    paginationRight.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderTVShows();
        }
    });

    // Modal chính
    document.querySelector('.add-btn').addEventListener('click', openAddTVModal);
    backdrop.addEventListener('click', closeModal);
    document.querySelector('.modal-tvshow .modal_close').addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalTV.classList.contains('hidden')) {
            if (subModal && subModal.classList.contains('hidden') && 
                actorsSubModal && actorsSubModal.classList.contains('hidden')) {
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

    // Sub-modal seasons
    tvFormEl.querySelector('.manage-seasons-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSeasonsModal();
    });
    
    subModal?.querySelector('.add-season-btn')?.addEventListener('click', () => {
        currentSeasons.push({
            title: `Season ${currentSeasons.length + 1}`,
            episodes: 0,
            overview: '',
            poster: '../../public/assets/image/movie_poster_default.jpg'
        });
        renderSeasonsList();
    });
    
    subModal?.querySelector('.save-seasons-btn')?.addEventListener('click', closeSeasonsModal);
    subModal?.querySelector('.sub-close')?.addEventListener('click', closeSeasonsModal);
    subModalBackdrop?.addEventListener('click', closeSeasonsModal);

    // Sub-modal actors
    tvFormEl.querySelector('.manage-actors-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openActorsModal();
    });

    actorsSubModal?.querySelector('.add-actor-btn')?.addEventListener('click', () => {
        const tvId = tvFormEl.querySelector('input[name="id"]').value || generateTVId();
        const newActorId = generateActorId(tvId);
        
        currentActors.push({
            id: newActorId,
            name: '',
            photo: '../../public/assets/image/user_avatar_default.jpg'
        });
        renderActorsList();
    });

    actorsSubModal?.querySelector('.save-actors-btn')?.addEventListener('click', closeActorsModal);
    actorsSubModal?.querySelector('.sub-close')?.addEventListener('click', closeActorsModal);
    actorsSubModalBackdrop?.addEventListener('click', closeActorsModal);

    // Submit form
    tvFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const getData = (name) => {
            const el = tvFormEl.querySelector(`[name="${name}"]`);
            return el ? el.value : '';
        };
        
        const tvData = {
            title: getData('title'),
            overview: getData('overview'),
            genre: getData('genre'),
            seasonsData: currentSeasons,
            actorsData: currentActors,
            country: getData('country'),
            creator: getData('creator'),
            actors: getData('actors'),
            producer: getData('producer'),
            budget: parseInt(getData('budget')) || 0,
            revenue: parseInt(getData('revenue')) || 0,
            trailer: getData('trailer'),
            rating: parseFloat(getData('rating')) || 0,
            status: getData('status')
        };

        const bannerFile = bannerInput.files[0];
        const posterFile = posterInput.files[0];
        
        tvData.banner = bannerFile ? await readFileAsDataURL(bannerFile) : bannerPreviewImg.src;
        tvData.poster = posterFile ? await readFileAsDataURL(posterFile) : posterPreviewImg.src;

        if (isEditMode && currentEditRow) {
            const tvId = currentEditRow.dataset.tvId;
            const index = allTVShows.findIndex(s => s.id === tvId);
            
            if (index !== -1) {
                allTVShows[index] = { ...allTVShows[index], ...tvData };
                filterTVShows();
            }
        } else {
            tvData.id = generateTVId();
            
            // Cập nhật actor IDs
            currentActors.forEach((actor, i) => {
                actor.id = `${tvData.id}-AC${String(i + 1).padStart(3, '0')}`;
            });
            tvData.actorsData = currentActors;
            
            allTVShows.push(tvData);
            filterTVShows();
            
            currentPage = getTotalPages();
            renderTVShows();
        }
        
        closeModal();
    });

    // KHỞI TẠO
    renderTVShows();
}