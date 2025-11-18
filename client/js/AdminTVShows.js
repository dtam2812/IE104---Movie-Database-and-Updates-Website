export async function AdminTVShows_js() {
    // Import global translation system
    const { initTranslate } = await import('./Translate.js');
    
    // Get translation function from global scope (set by Translate.js)
    const t = (key) => {
        const translations = window.translations || {};
        return translations[key] || key;
    };

    // Hàm re-translate cho dynamic elements (templates)
    const reTranslateElement = (el) => {
        if (!el) return;
        
        // Translate text content for data-i18n
        const textElements = el.querySelectorAll('[data-i18n]');
        textElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (key) elem.textContent = t(key);
        });
        
        // Translate placeholders for data-i18n-placeholder
        const placeholderElements = el.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n-placeholder');
            if (key) elem.placeholder = t(key);
        });
        
        // Translate labels if they have data-i18n (set textContent)
        const labelElements = el.querySelectorAll('label[data-i18n]');
        labelElements.forEach(label => {
            const key = label.getAttribute('data-i18n');
            if (key) {
                // Keep inner structure (e.g. span for required *)
                label.innerHTML = t(key);
            }
        });
    };

    function translateGenre(genreStr) {
        if (!genreStr) return '';
        
        const genreMap = {
            'Animation': 'genre.animation',
            'Fantasy': 'genre.fantasy',
            'Thriller': 'genre.thriller',
            'Drama': 'genre.drama',
            'Action': 'genre.action',
            'Crime': 'genre.crime',
            'Romance': 'genre.romance',
            'Horror': 'genre.horror',
            'Comedy': 'genre.comedy',
            'Adventure': 'genre.adventure',
            'Mystery': 'genre.mystery',
            'Sci-Fi': 'genre.scifi',
            'Science Fiction': 'genre.scifi',
            'War': 'genre.war',
            'Western': 'genre.western',
            'Music': 'genre.music',
            'Family': 'genre.family',
            'Documentary': 'genre.documentary',
            'History': 'genre.history'
        };
        
        const genres = genreStr.split(',').map(g => g.trim());
        const translatedGenres = genres.map(genre => {
            const key = genreMap[genre];
            if (key && t(key) !== key) {
                return t(key);
            }
            return genre;
        });
        
        return translatedGenres.join(', ');
    }

    // Load dữ liệu từ file Data.js 
    let tvShowsData = [];
    try {
        const module = await import('./Data.js');
        tvShowsData = module.tvShowsData || [];
    } catch {
        console.log('No initial TV show data, starting empty');
    }

    // Đợi DOM ready trước khi query selectors
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // DOM ELEMENTS (query sau khi DOM ready)
    // Modal elements
    const modalTV = document.querySelector('.modal--tvshow');
    const backdrop = document.querySelector('.modal--tvshow .modal__backdrop');
    const tvFormEl = document.querySelector('.form--tvshow form');
    const modalTitle = document.querySelector('.modal__title');
    const submitBtn = tvFormEl?.querySelector('.form__btn--primary');
    
    // Table & Pagination
    const tableBody = document.querySelector('.data-table__body');
    const tvCountHeading = document.querySelector('.data-table__title');
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
    const bannerPreviewImg = mediaPreview?.querySelector('.media-form__banner img');
    const posterPreviewImg = mediaPreview?.querySelector('.media-form__poster img');
    const bannerInput = mediaPreview?.querySelector('.media-form__banner-input');
    const posterInput = mediaPreview?.querySelector('.media-form__poster-input');

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

    // Debug logs cho selectors
    console.log('Modal TV found:', modalTV);
    console.log('Add button found:', document.querySelector('.admin-content__add-btn'));
    console.log('Submit btn found:', submitBtn);

    
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
        const translatedGenre = translateGenre(show.genre);
        const seasonsCount = Array.isArray(show.seasonsData) ? show.seasonsData.length : 0;
        const seasonsText = seasonsCount > 0 ? `${seasonsCount} ${t('admin.tvshows.season' + (seasonsCount > 1 ? 's' : ''))}` : t('common.na');
        const ratingHTML = show.rating > 0 
            ? `<span>${show.rating}</span>` 
            : `<span style="color: #717182;">${t('common.na')}</span>`;
        const statusColor = show.status === 'Released' ? '#4CAF50' : '#ff9800';
        const statusText = show.status === 'Released' 
            ? t('admin.tvshows.status.released') 
            : t('admin.tvshows.status.comingSoon');

        const row = document.createElement('tr');
        row.dataset.tvId = show.id;
        row.innerHTML = `
            <td class ="data-table__th">${no}</td>
            <td class ="data-table__th">
                <div class="movie-cell">
                    <div class="movie-cell__poster">
                        <img class="movie-cell__image" src="${show.poster}" alt="${show.title}">
                    </div>
                    <div class="movie-cell__title">
                        <span>${show.title}</span>
                    </div>
                </div>
            </td>
            <td class ="data-table__th">${translatedGenre}</td>
            <td class ="data-table__th">${seasonsText}</td>
            <td class ="data-table__th">${ratingHTML}</td>
            <td class ="data-table__th">
                <span style="color: ${statusColor}; font-weight: 600;">
                    ${statusText}
                </span>
            </td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--edit"><i class="fa-solid fa-pen"></i></button></td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--detail"><i class="fa-solid fa-circle-info"></i></button></td>
            <td class ="data-table__th"><button class="data-table__btn data-table__btn--delete"><i class="fa-solid fa-trash"></i></button></td>
        `;

        row.querySelector('.data-table__btn--edit').addEventListener('click', () => openEditTVModal(row));
        row.querySelector('.data-table__btn--delete').addEventListener('click', () => {
            const confirmMsg = t('admin.tvshows.modal.deleteConfirm').replace('{title}', show.title);
            if (confirm(confirmMsg)) {
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
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="9" style="text-align: center; padding: 2rem; color: #717182;">
                    ${t('admin.tvshows.noTVShows')}
                </td>
            `;
            tableBody.appendChild(emptyRow);
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
        const countText = t('admin.tvshows.count');
        
        if (filteredTVShows.length === allTVShows.length) {
            tvCountHeading.innerHTML = `<span data-i18n="admin.tvshows.count">${countText}</span> (${allTVShows.length})`;
        } else {
            tvCountHeading.innerHTML = `<span data-i18n="admin.tvshows.count">${countText}</span> (${filteredTVShows.length} / ${allTVShows.length})`;
        }
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
        const seasonDiv = seasonItem.querySelector('.season');
        
        // Set data
        const header = seasonDiv.querySelector('.season__header');
        const body = seasonDiv.querySelector('.season__body');
        const titleEl = seasonDiv.querySelector('.season__title');
        const titleInput = seasonDiv.querySelector('.season__input--title');
        const episodesInput = seasonDiv.querySelector('.season__input--episodes');
        const overviewInput = seasonDiv.querySelector('.season__input--overview');
        const posterImg = seasonDiv.querySelector('.season__poster-image');
        const posterInput = seasonDiv.querySelector('.season__poster-input');
        const deleteBtn = seasonDiv.querySelector('.season__delete-btn');
        
        titleEl.textContent = season.title || `${t('admin.tvshows.modal.season')} ${index + 1}`;
        titleInput.value = season.title || '';
        episodesInput.value = season.episodes || '';
        overviewInput.value = season.overview || '';
        posterImg.src = season.poster || '../../public/assets/image/0891b2.svg';
        
        // Áp dụng translation ngay lập tức (không cần setAttribute nữa vì dynamic)
        titleInput.placeholder = t('admin.tvshows.submodal.seasonTitlePlaceholder');
        episodesInput.placeholder = t('admin.tvshows.submodal.episodesPlaceholder');
        overviewInput.placeholder = t('admin.tvshows.submodal.overviewPlaceholder');
        
        // Re-translate toàn bộ element để apply labels
        reTranslateElement(seasonDiv);
        
        // Toggle hiển thị
        header.addEventListener('click', (e) => {
            if (e.target.closest('.season__delete-btn')) return;
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        
        // Xóa season
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(t('admin.tvshows.submodal.deleteConfirm'))) {
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
            titleEl.textContent = e.target.value || `${t('admin.tvshows.modal.season')} ${index + 1}`;
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
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'text-align: center; color: #717182; padding: 2rem;';
            emptyMsg.textContent = t('admin.tvshows.submodal.noSeasons');
            seasonsListEl.appendChild(emptyMsg);
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

    // Đóng sub-modal seasons và cập nhật dữ liệu
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
        
        titleEl.textContent = actor.name || `${t('admin.tvshows.modal.actor')} ${index + 1}`;
        idInput.value = actor.id || '';
        nameInput.value = actor.name || '';
        photoImg.src = actor.photo || '../../public/assets/image/user_avatar_default.jpg';
        
        // Áp dụng translation ngay lập tức
        idInput.placeholder = t('admin.movies.modal.autoGenerated');
        nameInput.placeholder = t('admin.movies.modal.actorNamePlaceholder');
        
        // Re-translate toàn bộ element để apply labels
        reTranslateElement(actorDiv);
        
        // Toggle hiển thị
        header.addEventListener('click', (e) => {
            if (e.target.closest('.actor__delete-btn')) return;
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        
        // Xóa actor
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(t('admin.tvshows.modal.deleteActorConfirm'))) {
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
            titleEl.textContent = e.target.value || `${t('admin.tvshows.modal.actor')} ${index + 1}`;
            currentActors[index].name = e.target.value;
        });
        
        return actorItem;
    };

    // Render danh sách actors trong sub-modal
    const renderActorsList = () => {
        if (!actorsListEl) return;

        actorsListEl.innerHTML = '';
        
        if (currentActors.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'text-align: center; color: #717182; padding: 2rem;';
            emptyMsg.textContent = t('admin.tvshows.noActors');
            actorsListEl.appendChild(emptyMsg);
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
        console.log('Opening add modal...');  // Debug
        if (!modalTV) {
            console.error('Modal not found! Selector issue.');
            return;
        }
        
        isEditMode = false;
        modalTitle.textContent = t('admin.tvshows.modal.add');
        submitBtn.textContent = t('admin.tvshows.modal.create');
        
        tvFormEl.reset();
        bannerPreviewImg.src = '../../public/assets/image/movie_banner_default.png';
        posterPreviewImg.src = '../../public/assets/image/0891b2.svg';
        
        currentSeasons = [];
        currentActors = [];
        tvFormEl.querySelector('input[name="seasons"]').value = '0';
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = '0';
        tvFormEl.querySelector('input[name="actorsCount"]').value = '0';
        
        const idDisplayGroup = tvFormEl.querySelector('.media-form__id-display');
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        
        modalTV.classList.remove('hidden');
        document.querySelector('.form--tvshow').classList.add('form--active');
    };

    // Mở modal chỉnh sửa TV show
    const openEditTVModal = (row) => {
        isEditMode = true;
        currentEditRow = row;
        
        const show = allTVShows.find(s => s.id === row.dataset.tvId);
        if (!show) return;
        
        modalTitle.textContent = t('admin.tvshows.modal.edit');
        submitBtn.textContent = t('admin.tvshows.modal.save');
        
        bannerPreviewImg.src = show.banner;
        posterPreviewImg.src = show.poster;
        
        const idDisplayGroup = tvFormEl.querySelector('.media-form__id-display');
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
        document.querySelector('.form--tvshow').classList.add('form--active');
    };

    // Đóng modal chính
    const closeModal = () => {
        modalTV.classList.add('hidden');
        document.querySelector('.form--tvshow').classList.remove('form--active');
        tvFormEl.reset();
        currentEditRow = null;
        isEditMode = false;
        currentSeasons = [];
        currentActors = [];
        bannerInput.value = '';
        posterInput.value = '';
    };

    // EVENT LISTENERS (attach sau khi query DOM)
    // Search & Filter
    if (searchInput) searchInput.addEventListener('input', filterTVShows);
    if (countryFilter) countryFilter.addEventListener('change', filterTVShows);
    if (statusFilter) statusFilter.addEventListener('change', filterTVShows);
    if (ratingFilter) ratingFilter.addEventListener('change', filterTVShows);

    // Pagination
    if (paginationLeft) paginationLeft.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTVShows();
        }
    });
    
    if (paginationRight) paginationRight.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderTVShows();
        }
    });

    // Modal chính - Attach event sau debug
    const addBtn = document.querySelector('.admin-content__add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            console.log('Add button clicked!');  // Debug
            e.preventDefault();  // Ngăn <a> default
            openAddTVModal();
        });
    } else {
        console.error('Add button not found!');
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    const closeBtn = document.querySelector('.modal--tvshow .modal__close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalTV.classList.contains('hidden')) {
            if (subModal && subModal.classList.contains('hidden') && 
                actorsSubModal && actorsSubModal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });

    // Upload ảnh
    if (bannerInput) bannerInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) bannerPreviewImg.src = await readFileAsDataURL(file);
    });

    if (posterInput) posterInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) posterPreviewImg.src = await readFileAsDataURL(file);
    });

    // Sub-modal seasons
    const manageSeasonsBtn = tvFormEl?.querySelector('.form__manage-btn--seasons');
    if (manageSeasonsBtn) manageSeasonsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSeasonsModal();
    });
    
    if (subModal?.querySelector('.sub-modal__add-btn')) subModal.querySelector('.sub-modal__add-btn').addEventListener('click', () => {
        currentSeasons.push({
            title: `${t('admin.tvshows.modal.season')} ${currentSeasons.length + 1}`,
            episodes: 0,
            overview: '',
            poster: '../../public/assets/image/0891b2.svg'
        });
        renderSeasonsList();
    });
    
    if (subModal?.querySelector('.sub-modal__save-btn')) subModal.querySelector('.sub-modal__save-btn').addEventListener('click', closeSeasonsModal);
    if (subModal?.querySelector('.sub-modal__close')) subModal.querySelector('.sub-modal__close').addEventListener('click', closeSeasonsModal);
    if (subModalBackdrop) subModalBackdrop.addEventListener('click', closeSeasonsModal);

    // Sub-modal actors
    const manageActorsBtn = tvFormEl?.querySelector('.form__manage-btn--actors');
    if (manageActorsBtn) manageActorsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openActorsModal();
    });

    if (actorsSubModal?.querySelector('.sub-modal__add-btn')) actorsSubModal.querySelector('.sub-modal__add-btn').addEventListener('click', () => {
        const tvId = tvFormEl.querySelector('input[name="id"]').value || generateTVId();
        const newActorId = generateActorId(tvId);
        
        currentActors.push({
            id: newActorId,
            name: '',
            photo: '../../public/assets/image/user_avatar_default.jpg'
        });
        renderActorsList();
    });

    if (actorsSubModal?.querySelector('.sub-modal__save-btn')) actorsSubModal.querySelector('.sub-modal__save-btn').addEventListener('click', closeActorsModal);
    if (actorsSubModal?.querySelector('.sub-modal__close')) actorsSubModal.querySelector('.sub-modal__close').addEventListener('click', closeActorsModal);
    if (actorsSubModalBackdrop) actorsSubModalBackdrop.addEventListener('click', closeActorsModal);

    // Submit form
    if (tvFormEl) tvFormEl.addEventListener('submit', async (e) => {
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

    // ========== LANGUAGE CHANGE LISTENER ==========
    window.addEventListener('languagechange', async (e) => {
        console.log('Language change detected in AdminTVShows');
        
        // Re-render everything with new language
        await initTranslate();
        renderTVShows();
        
        // Update modal if open
        if (!modalTV.classList.contains('hidden')) {
            modalTitle.textContent = isEditMode 
                ? t('admin.tvshows.modal.edit') 
                : t('admin.tvshows.modal.add');
            submitBtn.textContent = isEditMode 
                ? t('admin.tvshows.modal.save') 
                : t('admin.tvshows.modal.create');
        }
        
        // Update seasons modal if open
        if (subModal && !subModal.classList.contains('hidden')) {
            renderSeasonsList();
        }
        
        // Update actors modal if open
        if (actorsSubModal && !actorsSubModal.classList.contains('hidden')) {
            renderActorsList();
        }
    });

    // Initial render
    renderTVShows();
    console.log('AdminTVShows initialized');
}