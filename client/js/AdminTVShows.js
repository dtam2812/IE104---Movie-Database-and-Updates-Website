// Get current translations
let translations = {};
async function loadTranslations() {
  const lang = localStorage.getItem('language') || 'vi';
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    translations = await res.json();
  } catch (error) {
    console.error('Load translations failed:', error);
  }
}

// Helper function to get translated text
function t(key) {
  return translations[key] || key;
}

// Genre translation mapping
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
    'History': 'genre.history',
    'Action & Adventure': 'genre.action_adventure',
    'Kids': 'genre.kids',
    'News': 'genre.news',
    'Reality': 'genre.reality',
    'Sci-Fi & Fantasy': 'genre.scifi_fantasy',
    'Soap': 'genre.soap',
    'Talk': 'genre.talk',
    'War & Politics': 'genre.war_politics'
  };
  
  // Split by comma if multiple genres
  const genres = genreStr.split(',').map(g => g.trim());
  const translatedGenres = genres.map(genre => {
    const key = genreMap[genre];
    if (key && translations[key]) {
      return translations[key];
    }
    return genre; // fallback to original if no translation
  });
  
  return translatedGenres.join(', ');
}

// Hàm khởi tạo - tự động load data nếu có file TVShowData.js
export async function AdminTVShows_js() {
    // Load translations first
    await loadTranslations();

    let tvShowsData = [];
    try {
        const module = await import('./Data.js');
        tvShowsData = module.tvShowsData || [];
        console.log('✅ Loaded TV shows data from TVShowData.js');
    } catch {
        console.log('ℹ️ TVShowData.js not found, starting with empty data');
    }

    const modalTV = document.querySelector('.modal-tvshow');
    const addTVBtn = document.querySelector('.add-btn');
    const backdrop = document.querySelector('.modal-tvshow .modal_backdrop');
    const closeBtn = document.querySelector('.modal-tvshow .modal_close');
    const tvForm = document.querySelector('.form-wrapper.tvshow-form');
    const tvFormEl = tvForm.querySelector('form');
    const tvCountHeading = document.querySelector('.dm-table-heading h2');
    const modalTitle = document.querySelector('.modal-title');
    const submitBtn = tvFormEl.querySelector('.btn.btn-primary');

    let currentEditRow = null;
    let isEditMode = false;

    const tableBody = document.querySelector('.dm-table-body');
    
    // Media selectors
    const mediaPreview = tvForm.querySelector('.tvshow-media-right');
    const bannerPreviewImg = mediaPreview.querySelector('.banner-preview img');
    const posterPreviewImg = mediaPreview.querySelector('.poster-preview img');
    const bannerInput = mediaPreview.querySelector('.banner-input');
    const posterInput = mediaPreview.querySelector('.poster-input');

    const paginationLeft = document.querySelector('.pagination-left-arrow');
    const paginationRight = document.querySelector('.pagination-right-arrow');
    const currentPageSpan = document.querySelector('.pagination-page-current');
    const totalPagesSpan = document.querySelector('.pagination__main span:last-child');

    // TÌMKIẾM VÀ LỌC
    const searchInput = document.querySelector('.search-input');
    const countryFilter = document.querySelector('.filter-select:nth-child(1)');
    const statusFilter = document.querySelector('.filter-select:nth-child(2)');
    const ratingFilter = document.querySelector('.filter-select:nth-child(3)');

    // Sub-modal elements
    const subModal = document.getElementById('seasons-sub-modal');
    const subModalBackdrop = document.getElementById('seasons-backdrop');
    const subCloseBtn = subModal?.querySelector('.sub-close');
    const manageSeasonsBtn = tvFormEl.querySelector('.manage-seasons-btn');
    const addSeasonBtn = subModal?.querySelector('.add-season-btn');
    const saveSeasonsBtn = subModal?.querySelector('.save-seasons-btn');
    const seasonsListEl = subModal?.querySelector('#seasons-list');

    // Phân trang - Sử dụng data từ import hoặc empty array
    let allTVShows = [...tvShowsData];
    let filteredTVShows = [...allTVShows];
    let currentPage = 1;
    const tvPerPage = 5;

    let currentSeasons = [];  // Seasons tạm thời khi edit

    // Tạo ID TV theo format TV001, TV002, ...
    function generateTVId() {
        if (allTVShows.length === 0) {
            return 'TV001';
        }
        
        const maxNumber = allTVShows.reduce((max, show) => {
            const match = show.id.match(/^TV(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        
        const newNumber = maxNumber + 1;
        return 'TV' + String(newNumber).padStart(3, '0');
    }

    // Tính tổng số trang
    function getTotalPages() {
        return Math.ceil(filteredTVShows.length / tvPerPage);
    }

    // Lấy TV shows cho trang hiện tại
    function getTVShowsForCurrentPage() {
        const startIndex = (currentPage - 1) * tvPerPage;
        const endIndex = startIndex + tvPerPage;
        return filteredTVShows.slice(startIndex, endIndex);
    }

    // HÀM TÌMKIẾM VÀ LỌC
    function filterTVShows() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const countryValue = countryFilter.value;
        const statusValue = statusFilter.value;
        const ratingValue = ratingFilter.value;

        filteredTVShows = allTVShows.filter(show => {
            const matchSearch = 
                show.title.toLowerCase().includes(searchTerm) ||
                show.id.toLowerCase().includes(searchTerm);

            const matchCountry = countryValue === 'all' || show.country === countryValue;
            const matchStatus = statusValue === 'all' || show.status === statusValue;

            let matchRating = true;
            if (ratingValue !== 'all') {
                const minRating = parseFloat(ratingValue);
                matchRating = show.rating >= minRating;
            }

            return matchSearch && matchCountry && matchStatus && matchRating;
        });

        const totalPages = getTotalPages();
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 1;
        }
        
        renderTVShows();
    }

    // Event listeners cho tìm kiếm và lọc
    searchInput.addEventListener('input', filterTVShows);
    countryFilter.addEventListener('change', filterTVShows);
    statusFilter.addEventListener('change', filterTVShows);
    ratingFilter.addEventListener('change', filterTVShows);

    // Tạo row cho TV show
    function createTVRow(show, no) {
        const newRow = document.createElement('tr');
        newRow.dataset.tvId = show.id;

        const noCell = document.createElement('td');
        noCell.textContent = no;
        newRow.appendChild(noCell);

        const posterCell = document.createElement('td');
        posterCell.innerHTML = `
            <div class="movie-title">
                <div class="movie-poster">
                    <img src="${show.poster}" alt="${show.title}">
                </div>
                <div class="movie-title">
                    <span>${show.title}</span>
                </div>
            </div>
        `;
        newRow.appendChild(posterCell);

        const genreCell = document.createElement('td');
        const translatedGenre = translateGenre(show.genre);  
        genreCell.textContent = translatedGenre;
        newRow.appendChild(genreCell);

        // Hiển thị số seasons
        const seasonsCell = document.createElement('td');
        const seasonsCount = Array.isArray(show.seasonsData) ? show.seasonsData.length : 0;
        if (seasonsCount > 0) {
            const seasonText = seasonsCount > 1 ? t('admin.tvshows.seasons') : t('admin.tvshows.season');
            seasonsCell.textContent = `${seasonsCount} ${seasonText}`;
        } else {
            seasonsCell.textContent = t('common.na');
        }
        newRow.appendChild(seasonsCell);

        const ratingCell = document.createElement('td');
        ratingCell.innerHTML = show.rating > 0 
            ? `<span>${show.rating}</span>`
            : `<span style="color: #717182;">${t('common.na')}</span>`;
        newRow.appendChild(ratingCell);

        const statusCell = document.createElement('td');
        const statusColor = show.status === 'Released' ? '#4CAF50' : '#ff9800';
        const statusText = show.status === 'Released' 
            ? t('admin.movies.status.released') 
            : t('admin.movies.status.comingSoon');
        statusCell.innerHTML = `
            <span style="color: ${statusColor}; font-weight: 600;">
                ${statusText}
            </span>
        `;
        newRow.appendChild(statusCell);

        const editCell = document.createElement('td');
        editCell.innerHTML = `<button class="btn btn-edit"><i class="fa-solid fa-pen"></i></button>`;
        newRow.appendChild(editCell);

        const detailCell = document.createElement('td');
        detailCell.innerHTML = `<button class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></button>`;
        newRow.appendChild(detailCell);

        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `<button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button>`;
        newRow.appendChild(deleteCell);

        const editBtn = editCell.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => {
            openEditTVModal(newRow);
        });

        const deleteBtn = deleteCell.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', function() {
            const confirmMsg = t('admin.tvshows.modal.deleteConfirm').replace('{title}', show.title);
            if(confirm(confirmMsg)) {
                const tvId = newRow.dataset.tvId;
                allTVShows = allTVShows.filter(s => s.id !== tvId);
                filterTVShows();
            }
        });

        return newRow;
    }

    // Render bảng TV shows
    function renderTVShows() {
        tableBody.innerHTML = '';
        
        const tvToShow = getTVShowsForCurrentPage();
        const startNo = (currentPage - 1) * tvPerPage + 1;
        
        if (tvToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #717182;">
                        ${t('admin.tvshows.noTVShows')}
                    </td>
                </tr>
            `;
        } else {
            tvToShow.forEach((show, index) => {
                const newRow = createTVRow(show, startNo + index);
                tableBody.appendChild(newRow);
            });
        }
        
        updateTVCount();
        updatePaginationButtons();
    }

    // Cập nhật số lượng TV show
    function updateTVCount() {
        const countSpan = tvCountHeading.querySelector('span[data-i18n="admin.tvshows.count"]');
        if (filteredTVShows.length === allTVShows.length) {
            tvCountHeading.innerHTML = `<span data-i18n="admin.tvshows.count">${t('admin.tvshows.count')}</span> (${allTVShows.length})`;
        } else {
            tvCountHeading.innerHTML = `<span data-i18n="admin.tvshows.count">${t('admin.tvshows.count')}</span> (${filteredTVShows.length} / ${allTVShows.length})`;
        }
    }

    // Cập nhật nút phân trang
    function updatePaginationButtons() {
        const totalPages = getTotalPages();
        
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = `/ ${totalPages}`;
        
        if (currentPage === 1 || totalPages === 0) {
            paginationLeft.classList.add('disable');
            paginationLeft.disabled = true;
        } else {
            paginationLeft.classList.remove('disable');
            paginationLeft.disabled = false;
        }
        
        if (currentPage >= totalPages || totalPages === 0) {
            paginationRight.classList.add('disable');
            paginationRight.disabled = true;
        } else {
            paginationRight.classList.remove('disable');
            paginationRight.disabled = false;
        }
    }

    // Event listeners cho phân trang
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

    // KHỞI TẠO
    renderTVShows();

    // ========== MODAL ADD/EDIT ==========
    addTVBtn.addEventListener('click', () => {
        isEditMode = false;
        modalTitle.textContent = t('admin.tvshows.modal.add');
        submitBtn.textContent = t('admin.movies.modal.create');
        
        // Reset form và preview
        tvFormEl.reset();
        bannerPreviewImg.src = '../../public/assets/image/movie_banner_default.jpg';
        posterPreviewImg.src = '../../public/assets/image/movie_poster_default.jpg';
        
        // Reset seasons
        currentSeasons = [];
        tvFormEl.querySelector('input[name="seasons"]').value = '0';
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = '0';
        
        // Ẩn trường ID display khi Add
        const idDisplayGroup = tvFormEl.querySelector('.tvshow-id-display');
        if (idDisplayGroup) idDisplayGroup.style.display = 'none';
        
        modalTV.classList.remove('hidden');
        tvForm.classList.add('active');
    });

    function openEditTVModal(row) {
        isEditMode = true;
        currentEditRow = row;
        
        const tvId = row.dataset.tvId;
        const tvShow = allTVShows.find(s => s.id === tvId);
        
        if (!tvShow) return;
        
        modalTitle.textContent = t('admin.tvshows.modal.edit');
        submitBtn.textContent = t('admin.movies.modal.save');
        
        // Hiển thị preview với data hiện tại
        bannerPreviewImg.src = tvShow.banner;
        posterPreviewImg.src = tvShow.poster;
        
        // Hiển thị ID (readonly)
        const idDisplayGroup = tvFormEl.querySelector('.tvshow-id-display');
        const idDisplayInput = tvFormEl.querySelector('input[name="id-display"]');
        if (idDisplayGroup && idDisplayInput) {
            idDisplayGroup.style.display = 'block';
            idDisplayInput.value = tvShow.id;
        }
        
        // Điền dữ liệu
        tvFormEl.querySelector('input[name="id"]').value = tvShow.id;
        tvFormEl.querySelector('input[name="title"]').value = tvShow.title;
        tvFormEl.querySelector('textarea[name="overview"]').value = tvShow.overview || '';
        tvFormEl.querySelector('input[name="genre"]').value = tvShow.genre;
        tvFormEl.querySelector('input[name="country"]').value = tvShow.country;
        tvFormEl.querySelector('input[name="creator"]').value = tvShow.creator || '';
        tvFormEl.querySelector('input[name="actors"]').value = tvShow.actors || '';
        tvFormEl.querySelector('input[name="producer"]').value = tvShow.producer || '';
        tvFormEl.querySelector('input[name="budget"]').value = tvShow.budget || '';
        tvFormEl.querySelector('input[name="revenue"]').value = tvShow.revenue || '';
        tvFormEl.querySelector('input[name="trailer"]').value = tvShow.trailer || '';
        tvFormEl.querySelector('input[name="rating"]').value = tvShow.rating || '';
        tvFormEl.querySelector('select[name="status"]').value = tvShow.status;
        
        // Load seasons data (deep copy)
        currentSeasons = Array.isArray(tvShow.seasonsData) ? JSON.parse(JSON.stringify(tvShow.seasonsData)) : [];
        const seasonsCount = currentSeasons.length;
        tvFormEl.querySelector('input[name="seasons"]').value = seasonsCount;
        
        // Tính tổng episodes
        const totalEps = currentSeasons.reduce((sum, s) => sum + (parseInt(s.episodes) || 0), 0);
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = totalEps;
        
        modalTV.classList.remove('hidden');
        tvForm.classList.add('active');
    }

    function closeModal() {
        modalTV.classList.add('hidden');
        tvFormEl.reset();
        currentEditRow = null;
        isEditMode = false;
        currentSeasons = [];
        bannerInput.value = '';
        posterInput.value = '';
    }

    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && !modalTV.classList.contains('hidden')) {
            // Chỉ đóng modal chính nếu sub-modal không mở
            if (subModal && subModal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });

    // Upload banner mới
    bannerInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                bannerPreviewImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Upload poster mới
    posterInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                posterPreviewImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // ========== SEASONS SUB-MODAL ==========
    
    function renderSeasonsList() {
        if (!seasonsListEl) return;
        
        seasonsListEl.innerHTML = '';
        
        if (currentSeasons.length === 0) {
            seasonsListEl.innerHTML = `<p style="text-align: center; color: #717182; padding: 2rem;">${t('admin.tvshows.submodal.noSeasons')}</p>`;
            return;
        }
        
        currentSeasons.forEach((season, index) => {
            const seasonDiv = document.createElement('div');
            seasonDiv.className = 'season-item';
            seasonDiv.innerHTML = `
                <div class="season-header" data-index="${index}">
                    <h4>${t('admin.tvshows.season')} ${index + 1}</h4>
                    <button type="button" class="btn-icon delete-season-btn" data-index="${index}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="season-body" data-index="${index}">
                    <div class="form-group mb1">
                        <label><span data-i18n="admin.tvshows.submodal.seasonTitle">${t('admin.tvshows.submodal.seasonTitle')}</span></label>
                        <input type="text" class="form-control season-title" value="${season.title || ''}" placeholder="${t('admin.tvshows.submodal.seasonTitlePlaceholder')}" data-index="${index}">
                    </div>
                    <div class="form-group mb1">
                        <label><span data-i18n="admin.tvshows.submodal.episodes">${t('admin.tvshows.submodal.episodes')}</span></label>
                        <input type="number" class="form-control season-episodes" value="${season.episodes || ''}" placeholder="${t('admin.tvshows.submodal.episodesPlaceholder')}" min="1" data-index="${index}">
                    </div>
                    <div class="form-group mb1">
                        <label><span data-i18n="admin.tvshows.submodal.overview">${t('admin.tvshows.submodal.overview')}</span></label>
                        <textarea class="form-control season-overview" placeholder="${t('admin.tvshows.submodal.overviewPlaceholder')}" rows="3" data-index="${index}">${season.overview || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label><span data-i18n="admin.tvshows.submodal.seasonPoster">${t('admin.tvshows.submodal.seasonPoster')}</span></label>
                        <div class="season-poster-preview">
                            <img src="${season.poster || '../../public/assets/image/movie_poster_default.jpg'}" alt="Season Poster" class="season-poster-img">
                            <input type="file" class="season-poster-input" accept="image/*" data-index="${index}">
                        </div>
                    </div>
                </div>
            `;
            seasonsListEl.appendChild(seasonDiv);
            
            // Event listener cho toggle season body (click header)
            const header = seasonDiv.querySelector('.season-header');
            const body = seasonDiv.querySelector('.season-body');
            header.addEventListener('click', (e) => {
                // Không toggle nếu click vào nút delete
                if (e.target.closest('.delete-season-btn')) return;
                
                // Toggle display
                if (body.style.display === 'none' || body.style.display === '') {
                    body.style.display = 'block';
                } else {
                    body.style.display = 'none';
                }
            });
            
            // Mở season body mặc định
            body.style.display = 'block';
            
            // Event listener cho delete season
            const deleteBtn = seasonDiv.querySelector('.delete-season-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click
                if (confirm(t('admin.tvshows.submodal.deleteConfirm'))) {
                    currentSeasons.splice(index, 1);
                    renderSeasonsList();
                }
            });
            
            // Event listener cho upload poster
            const posterInput = seasonDiv.querySelector('.season-poster-input');
            const posterImg = seasonDiv.querySelector('.season-poster-img');
            posterInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        posterImg.src = event.target.result;
                        currentSeasons[index].poster = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    function openSeasonsModal() {
        if (!subModal || !subModalBackdrop) return;
        renderSeasonsList();
        subModal.classList.remove('hidden');
        subModalBackdrop.classList.remove('hidden');
    }

    function closeSeasonsModal() {
        if (!subModal || !subModalBackdrop) return;
        
        // Cập nhật data từ form inputs
        const titleInputs = seasonsListEl.querySelectorAll('.season-title');
        const episodesInputs = seasonsListEl.querySelectorAll('.season-episodes');
        const overviewInputs = seasonsListEl.querySelectorAll('.season-overview');
        
        titleInputs.forEach((input, index) => {
            if (currentSeasons[index]) {
                currentSeasons[index].title = input.value;
            }
        });
        
        episodesInputs.forEach((input, index) => {
            if (currentSeasons[index]) {
                currentSeasons[index].episodes = parseInt(input.value) || 0;
            }
        });
        
        overviewInputs.forEach((input, index) => {
            if (currentSeasons[index]) {
                currentSeasons[index].overview = input.value;
            }
        });
        
        // Cập nhật số seasons và tổng episodes
        tvFormEl.querySelector('input[name="seasons"]').value = currentSeasons.length;
        const totalEps = currentSeasons.reduce((sum, s) => sum + (parseInt(s.episodes) || 0), 0);
        tvFormEl.querySelector('input[name="totalEpisodes"]').value = totalEps;
        
        subModal.classList.add('hidden');
        subModalBackdrop.classList.add('hidden');
    }

    // Event listeners cho seasons sub-modal
    if (manageSeasonsBtn) {
        manageSeasonsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSeasonsModal();
        });
    }

    if (addSeasonBtn) {
        addSeasonBtn.addEventListener('click', () => {
            const seasonNumber = currentSeasons.length + 1;
            const newSeason = {
                title: `${t('admin.tvshows.season')} ${seasonNumber}`,
                episodes: 0,
                overview: '',
                poster: '../../public/assets/image/movie_poster_default.jpg'
            };
            currentSeasons.push(newSeason);
            renderSeasonsList();
        });
    }

    if (saveSeasonsBtn) {
        saveSeasonsBtn.addEventListener('click', () => {
            closeSeasonsModal();
        });
    }

    // Close sub-modal với nút X
    if (subCloseBtn) {
        subCloseBtn.addEventListener('click', () => {
            closeSeasonsModal();
        });
    }

    // Close sub-modal khi click backdrop
    if (subModalBackdrop) {
        subModalBackdrop.addEventListener('click', () => {
            closeSeasonsModal();
        });
    }

    // SUBMIT FORM
    tvFormEl.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = tvFormEl.querySelector('input[name="title"]').value;
        const overview = tvFormEl.querySelector('textarea[name="overview"]').value;
        const genre = tvFormEl.querySelector('input[name="genre"]').value;
        const country = tvFormEl.querySelector('input[name="country"]').value;
        const creator = tvFormEl.querySelector('input[name="creator"]').value;
        const actors = tvFormEl.querySelector('input[name="actors"]').value;
        const producer = tvFormEl.querySelector('input[name="producer"]').value;
        const budget = parseInt(tvFormEl.querySelector('input[name="budget"]').value) || 0;
        const revenue = parseInt(tvFormEl.querySelector('input[name="revenue"]').value) || 0;
        const trailer = tvFormEl.querySelector('input[name="trailer"]').value || '';
        const rating = parseFloat(tvFormEl.querySelector('input[name="rating"]').value) || 0;
        const status = tvFormEl.querySelector('select[name="status"]').value;
        
        let bannerURL, posterURL;
        const bannerFile = bannerInput.files[0];
        const posterFile = posterInput.files[0];
        
        let filesProcessed = 0;
        const totalFiles = 2;
        
        function processFiles() {
            filesProcessed++;
            if (filesProcessed === totalFiles) {
                saveTVShow();
            }
        }
        
        if (bannerFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                bannerURL = e.target.result;
                processFiles();
            };
            reader.readAsDataURL(bannerFile);
        } else {
            bannerURL = bannerPreviewImg.src;
            processFiles();
        }
        
        if (posterFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                posterURL = e.target.result;
                processFiles();
            };
            reader.readAsDataURL(posterFile);
        } else {
            posterURL = posterPreviewImg.src;
            processFiles();
        }
        
        function saveTVShow() {
            if (isEditMode && currentEditRow) {
                // EDIT MODE
                const tvId = currentEditRow.dataset.tvId;
                const tvIndex = allTVShows.findIndex(s => s.id === tvId);
                
                if (tvIndex !== -1) {
                    allTVShows[tvIndex] = {
                        ...allTVShows[tvIndex],
                        title: title,
                        overview: overview,
                        genre: genre,
                        seasonsData: currentSeasons,
                        country: country,
                        creator: creator,
                        actors: actors,
                        producer: producer,
                        budget: budget,
                        revenue: revenue,
                        trailer: trailer,
                        rating: rating,
                        status: status,
                        banner: bannerURL,
                        poster: posterURL
                    };
                    
                    filterTVShows();
                }
            } else {
                // ADD MODE
                const newTVShow = {
                    id: generateTVId(),
                    title: title,
                    overview: overview,
                    genre: genre,
                    seasonsData: currentSeasons,
                    country: country,
                    creator: creator,
                    actors: actors,
                    producer: producer,
                    budget: budget,
                    revenue: revenue,
                    trailer: trailer,
                    rating: rating,
                    status: status,
                    banner: bannerURL,
                    poster: posterURL
                };
                
                allTVShows.push(newTVShow);
                filterTVShows();
                
                // Chuyển đến trang cuối nơi có TV show mới
                currentPage = getTotalPages();
                renderTVShows();
            }
            
            closeModal();
        }
    });

    // Listen for language change
    window.addEventListener('languagechange', async (e) => {
        await loadTranslations();
        renderTVShows();
    });
}