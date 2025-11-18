import { moviesData } from "./Data.js";

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
    'History': 'genre.history'
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

export async function AdminMovies_js() {
  // Load translations first
  await loadTranslations();

  const modalMovie = document.querySelector(".modal-movie");
  const addMovieBtn = document.querySelector(".add-btn");
  const backdrop = document.querySelector(".modal-movie .modal_backdrop");
  const closeBtn = document.querySelector(".modal-movie .modal_close");
  const movieForm = document.querySelector(".form-wrapper.movie-form");
  const movieFormEl = movieForm.querySelector("form");
  const movieCountHeading = document.querySelector(".dm-table-heading h2");
  const modalTitle = document.querySelector(".modal-title");
  const submitBtn = movieFormEl.querySelector(".btn.btn-primary");

  let currentEditRow = null;
  let isEditMode = false;

  const tableBody = document.querySelector(".dm-table-body");

  const mediaPreview = movieForm.querySelector(".movie-media-right");
  const bannerPreviewImg = mediaPreview.querySelector(".banner-preview img");
  const posterPreviewImg = mediaPreview.querySelector(".poster-preview img");
  const bannerInput = mediaPreview.querySelector(".banner-input");
  const posterInput = mediaPreview.querySelector(".poster-input");

  const paginationLeft = document.querySelector(".pagination-left-arrow");
  const paginationRight = document.querySelector(".pagination-right-arrow");
  const currentPageSpan = document.querySelector(".pagination-page-current");
  const totalPagesSpan = document.querySelector(
    ".pagination__main span:last-child"
  );

  const searchInput = document.querySelector(".search-input");
  const countryFilter = document.querySelector(".filter-select:nth-child(1)");
  const statusFilter = document.querySelector(".filter-select:nth-child(2)");
  const ratingFilter = document.querySelector(".filter-select:nth-child(3)");

  let allMovies = [];

  try {
    if (typeof moviesData !== "undefined") {
      allMovies = [...moviesData];
    }
  } catch (error) {
    console.log("No initial movie data, starting with empty array");
  }

  let filteredMovies = [...allMovies];
  let currentPage = 1;
  const moviesPerPage = 5;

  function generateMovieId() {
    if (allMovies.length === 0) {
      return "MV001";
    }

    const maxNumber = allMovies.reduce((max, movie) => {
      const match = movie.id.match(/^MV(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newNumber = maxNumber + 1;
    return "MV" + String(newNumber).padStart(3, "0");
  }

  function getTotalPages() {
    return Math.ceil(filteredMovies.length / moviesPerPage);
  }

  function getMoviesForCurrentPage() {
    const startIndex = (currentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return filteredMovies.slice(startIndex, endIndex);
  }

  function filterMovies() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const countryValue = countryFilter.value;
    const statusValue = statusFilter.value;
    const ratingValue = ratingFilter.value;

    filteredMovies = allMovies.filter((movie) => {
      const matchSearch =
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.id.toLowerCase().includes(searchTerm);

      const matchCountry =
        countryValue === "all" || movie.country === countryValue;
      const matchStatus = statusValue === "all" || movie.status === statusValue;

      let matchRating = true;
      if (ratingValue !== "all") {
        const minRating = parseFloat(ratingValue);
        matchRating = movie.rating >= minRating;
      }

      return matchSearch && matchCountry && matchStatus && matchRating;
    });

    const totalPages = getTotalPages();
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    renderMovies();
  }

  searchInput.addEventListener("input", filterMovies);
  countryFilter.addEventListener("change", filterMovies);
  statusFilter.addEventListener("change", filterMovies);
  ratingFilter.addEventListener("change", filterMovies);

  function createMovieRow(movie, no) {
    const newRow = document.createElement("tr");
    newRow.dataset.movieId = movie.id;

    const noCell = document.createElement("td");
    noCell.textContent = no;
    newRow.appendChild(noCell);

    const posterCell = document.createElement("td");
    posterCell.innerHTML = `
            <div class="movie-title">
                <div class="movie-poster">
                    <img src="${movie.poster}" alt="${movie.title}">
                </div>
                <div class="movie-title">
                    <span>${movie.title}</span>
                </div>
            </div>
        `;
    newRow.appendChild(posterCell);

    const genreCell = document.createElement("td");
    const translatedGenre = translateGenre(movie.genre);
    genreCell.textContent = translatedGenre;
    newRow.appendChild(genreCell);

    const durationCell = document.createElement("td");
    durationCell.textContent =
      movie.duration > 0 ? `${movie.duration} ${t('common.minutes')}` : "N/A";
    newRow.appendChild(durationCell);

    const ratingCell = document.createElement("td");
    ratingCell.innerHTML =
      movie.rating > 0
        ? `<span>${movie.rating}</span>`
        : '<span style="color: #717182;">N/A</span>';
    newRow.appendChild(ratingCell);

    const statusCell = document.createElement("td");
    const statusColor = movie.status === "Released" ? "#4CAF50" : "#ff9800";
    const statusText = movie.status === "Released" 
      ? t('admin.movies.status.released') 
      : t('admin.movies.status.comingSoon');
    statusCell.innerHTML = `
            <span style="color: ${statusColor}; font-weight: 600;">
                ${statusText}
            </span>
        `;
    newRow.appendChild(statusCell);

    const editCell = document.createElement("td");
    editCell.innerHTML = `<button class="btn btn-edit"><i class="fa-solid fa-pen"></i></button>`;
    newRow.appendChild(editCell);

    const detailCell = document.createElement("td");
    detailCell.innerHTML = `<button class="btn btn-detail"><i class="fa-solid fa-circle-info"></i></button>`;
    newRow.appendChild(detailCell);

    const deleteCell = document.createElement("td");
    deleteCell.innerHTML = `<button class="btn btn-delete"><i class="fa-solid fa-trash"></i></button>`;
    newRow.appendChild(deleteCell);

    const editBtn = editCell.querySelector(".btn-edit");
    editBtn.addEventListener("click", () => {
      openEditModal(newRow);
    });

    const deleteBtn = deleteCell.querySelector(".btn-delete");
    deleteBtn.addEventListener("click", function () {
      const confirmMsg = `${t('admin.movies.modal.deleteConfirm').replace('{title}', movie.title)}`;
      if (confirm(confirmMsg)) {
        const movieId = newRow.dataset.movieId;
        allMovies = allMovies.filter((m) => m.id !== movieId);
        filterMovies();
      }
    });

    return newRow;
  }

  function renderMovies() {
    tableBody.innerHTML = "";

    const moviesToShow = getMoviesForCurrentPage();
    const startNo = (currentPage - 1) * moviesPerPage + 1;

    if (moviesToShow.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #717182;">
                        ${t('admin.movies.noMovies')}
                    </td>
                </tr>
            `;
    } else {
      moviesToShow.forEach((movie, index) => {
        const newRow = createMovieRow(movie, startNo + index);
        tableBody.appendChild(newRow);
      });
    }

    updateMovieCount();
    updatePaginationButtons();
  }

  function updateMovieCount() {
    if (filteredMovies.length === allMovies.length) {
      movieCountHeading.innerHTML = `<span data-i18n="admin.movies.count">${t('admin.movies.count')}</span> (${allMovies.length})`;
    } else {
      movieCountHeading.innerHTML = `<span data-i18n="admin.movies.count">${t('admin.movies.count')}</span> (${filteredMovies.length} / ${allMovies.length})`;
    }
  }

  function updatePaginationButtons() {
    const totalPages = getTotalPages();

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = `/ ${totalPages}`;

    if (currentPage === 1 || totalPages === 0) {
      paginationLeft.classList.add("disable");
      paginationLeft.disabled = true;
    } else {
      paginationLeft.classList.remove("disable");
      paginationLeft.disabled = false;
    }

    if (currentPage >= totalPages || totalPages === 0) {
      paginationRight.classList.add("disable");
      paginationRight.disabled = true;
    } else {
      paginationRight.classList.remove("disable");
      paginationRight.disabled = false;
    }
  }

  paginationLeft.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderMovies();
    }
  });

  paginationRight.addEventListener("click", () => {
    if (currentPage < getTotalPages()) {
      currentPage++;
      renderMovies();
    }
  });

  // INITIALIZE
  renderMovies();

  // ========== MODAL ADD/EDIT ==========
  addMovieBtn.addEventListener("click", () => {
    isEditMode = false;
    modalTitle.textContent = t('admin.movies.modal.add');
    submitBtn.textContent = t('admin.movies.modal.create');

    movieFormEl.reset();
    bannerPreviewImg.src = "../../public/assets/image/movie_banner_default.jpg";
    posterPreviewImg.src = "../../public/assets/image/movie_poster_default.jpg";

    const idDisplayGroup = movieFormEl.querySelector(".movie-id-display");
    if (idDisplayGroup) idDisplayGroup.style.display = "none";

    modalMovie.classList.remove("hidden");
    movieForm.classList.add("active");
  });

  function openEditModal(row) {
    isEditMode = true;
    currentEditRow = row;

    const movieId = row.dataset.movieId;
    const movie = allMovies.find((m) => m.id === movieId);

    if (!movie) return;

    modalTitle.textContent = t('admin.movies.modal.edit');
    submitBtn.textContent = t('admin.movies.modal.save');

    bannerPreviewImg.src = movie.banner;
    posterPreviewImg.src = movie.poster;

    const idDisplayGroup = movieFormEl.querySelector(".movie-id-display");
    const idDisplayInput = movieFormEl.querySelector(
      'input[name="id-display"]'
    );
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = movie.id;
    }

    movieFormEl.querySelector('input[name="id"]').value = movie.id;
    movieFormEl.querySelector('input[name="title"]').value = movie.title;
    movieFormEl.querySelector('textarea[name="overview"]').value =
      movie.overview || "";
    movieFormEl.querySelector('input[name="genre"]').value = movie.genre;
    movieFormEl.querySelector('input[name="duration"]').value =
      movie.duration || "";
    movieFormEl.querySelector('input[name="country"]').value = movie.country;
    movieFormEl.querySelector('input[name="director"]').value =
      movie.director || "";
    movieFormEl.querySelector('input[name="actors"]').value =
      movie.actors || "";
    movieFormEl.querySelector('input[name="producer"]').value =
      movie.producer || "";
    movieFormEl.querySelector('input[name="budget"]').value =
      movie.budget || "";
    movieFormEl.querySelector('input[name="revenue"]').value =
      movie.revenue || "";
    movieFormEl.querySelector('input[name="trailer"]').value =
      movie.trailer || "";
    movieFormEl.querySelector('input[name="rating"]').value =
      movie.rating || "";
    movieFormEl.querySelector('select[name="status"]').value = movie.status;

    modalMovie.classList.remove("hidden");
    movieForm.classList.add("active");
  }

  function closeModal() {
    modalMovie.classList.add("hidden");
    movieFormEl.reset();
    currentEditRow = null;
    isEditMode = false;
    bannerInput.value = "";
    posterInput.value = "";
  }

  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalMovie.classList.contains("hidden")) {
      closeModal();
    }
  });

  bannerInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        bannerPreviewImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  posterInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        posterPreviewImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  movieFormEl.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = movieFormEl.querySelector('input[name="title"]').value;
    const overview = movieFormEl.querySelector(
      'textarea[name="overview"]'
    ).value;
    const genre = movieFormEl.querySelector('input[name="genre"]').value;
    const duration =
      parseInt(movieFormEl.querySelector('input[name="duration"]').value) || 0;
    const country = movieFormEl.querySelector('input[name="country"]').value;
    const director = movieFormEl.querySelector('input[name="director"]').value;
    const actors = movieFormEl.querySelector('input[name="actors"]').value;
    const producer = movieFormEl.querySelector('input[name="producer"]').value;
    const budget =
      parseInt(movieFormEl.querySelector('input[name="budget"]').value) || 0;
    const revenue =
      parseInt(movieFormEl.querySelector('input[name="revenue"]').value) || 0;
    const trailer =
      movieFormEl.querySelector('input[name="trailer"]').value || "";
    const rating =
      parseFloat(movieFormEl.querySelector('input[name="rating"]').value) || 0;
    const status = movieFormEl.querySelector('select[name="status"]').value;

    let bannerURL, posterURL;
    const bannerFile = bannerInput.files[0];
    const posterFile = posterInput.files[0];

    let filesProcessed = 0;
    const totalFiles = 2;

    function processFiles() {
      filesProcessed++;
      if (filesProcessed === totalFiles) {
        saveMovie();
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

    function saveMovie() {
      if (isEditMode && currentEditRow) {
        const movieId = currentEditRow.dataset.movieId;
        const movieIndex = allMovies.findIndex((m) => m.id === movieId);

        if (movieIndex !== -1) {
          allMovies[movieIndex] = {
            ...allMovies[movieIndex],
            title: title,
            overview: overview,
            genre: genre,
            duration: duration,
            country: country,
            director: director,
            actors: actors,
            producer: producer,
            budget: budget,
            revenue: revenue,
            trailer: trailer,
            rating: rating,
            status: status,
            banner: bannerURL,
            poster: posterURL,
          };

          filterMovies();
        }
      } else {
        const newMovie = {
          id: generateMovieId(),
          title: title,
          overview: overview,
          genre: genre,
          duration: duration,
          country: country,
          director: director,
          actors: actors,
          producer: producer,
          budget: budget,
          revenue: revenue,
          trailer: trailer,
          rating: rating,
          status: status,
          banner: bannerURL,
          poster: posterURL,
        };

        allMovies.push(newMovie);
        filterMovies();

        currentPage = getTotalPages();
        renderMovies();
      }

      closeModal();
    }
  });

  // Listen for language change
  window.addEventListener('languagechange', async (e) => {
    await loadTranslations();
    renderMovies();
  });
}