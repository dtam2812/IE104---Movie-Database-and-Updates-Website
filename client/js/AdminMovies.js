import { moviesData } from "./Data.js";

export function AdminMovies_js() {
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

  // Lấy đúng selector theo HTML
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

  // TÌM KIẾM VÀ LỌC
  const searchInput = document.querySelector(".search-input");
  const countryFilter = document.querySelector(".filter-select:nth-child(1)");
  const statusFilter = document.querySelector(".filter-select:nth-child(2)");
  const ratingFilter = document.querySelector(".filter-select:nth-child(3)");

  // Phân trang - Khởi tạo mảng rỗng nếu không có moviesData
  let allMovies = [];

  // Thử import moviesData nếu có
  try {
    // Nếu có moviesData từ import, sử dụng nó
    if (typeof moviesData !== "undefined") {
      allMovies = [...moviesData];
    }
  } catch (error) {
    // Nếu không có, sử dụng mảng rỗng
    console.log("No initial movie data, starting with empty array");
  }

  let filteredMovies = [...allMovies];
  let currentPage = 1;
  const moviesPerPage = 5;

  // Tạo ID tự động tăng theo format MV001, MV002, ...
  function generateMovieId() {
    if (allMovies.length === 0) {
      return "MV001";
    }

    // Tìm số lớn nhất trong các ID hiện có
    const maxNumber = allMovies.reduce((max, movie) => {
      const match = movie.id.match(/^MV(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    // Tạo ID mới = số lớn nhất + 1
    const newNumber = maxNumber + 1;
    return "MV" + String(newNumber).padStart(3, "0");
  }

  // Tính tổng số trang
  function getTotalPages() {
    return Math.ceil(filteredMovies.length / moviesPerPage);
  }

  // Lấy movies cho trang hiện tại
  function getMoviesForCurrentPage() {
    const startIndex = (currentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return filteredMovies.slice(startIndex, endIndex);
  }

  // HÀM TÌM KIẾM VÀ LỌC - SỬA: Giữ nguyên trang hiện tại nếu có thể
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

    // SỬA: Giữ trang hiện tại, chỉ reset về 1 nếu vượt quá tổng số trang
    const totalPages = getTotalPages();
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    renderMovies();
  }

  // Event listeners cho tìm kiếm và lọc
  searchInput.addEventListener("input", filterMovies);
  countryFilter.addEventListener("change", filterMovies);
  statusFilter.addEventListener("change", filterMovies);
  ratingFilter.addEventListener("change", filterMovies);

  // Tạo row cho movie
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
    genreCell.textContent = movie.genre;
    newRow.appendChild(genreCell);

    const durationCell = document.createElement("td");
    durationCell.textContent =
      movie.duration > 0 ? `${movie.duration} min` : "N/A";
    newRow.appendChild(durationCell);

    const ratingCell = document.createElement("td");
    ratingCell.innerHTML =
      movie.rating > 0
        ? `<span>${movie.rating}</span>`
        : '<span style="color: #717182;">N/A</span>';
    newRow.appendChild(ratingCell);

    const statusCell = document.createElement("td");
    const statusColor = movie.status === "Released" ? "#4CAF50" : "#ff9800";
    statusCell.innerHTML = `
            <span style="color: ${statusColor}; font-weight: 600;">
                ${movie.status}
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
      if (confirm(`Are you sure you want to delete "${movie.title}"?`)) {
        const movieId = newRow.dataset.movieId;
        allMovies = allMovies.filter((m) => m.id !== movieId);
        filterMovies();
      }
    });

    return newRow;
  }

  // Render bảng movies
  function renderMovies() {
    tableBody.innerHTML = "";

    const moviesToShow = getMoviesForCurrentPage();
    const startNo = (currentPage - 1) * moviesPerPage + 1;

    if (moviesToShow.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #717182;">
                        No movies found
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

  // Cập nhật số lượng movie
  function updateMovieCount() {
    if (filteredMovies.length === allMovies.length) {
      movieCountHeading.textContent = `Movies (${allMovies.length})`;
    } else {
      movieCountHeading.textContent = `Movies (${filteredMovies.length} / ${allMovies.length})`;
    }
  }

  // Cập nhật nút phân trang
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

  // Event listeners cho phân trang
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

  // KHỞI TẠO
  renderMovies();

  // ========== MODAL ADD/EDIT ==========
  addMovieBtn.addEventListener("click", () => {
    isEditMode = false;
    modalTitle.textContent = "Add Movie";
    submitBtn.textContent = "Create";

    // Reset form và preview
    movieFormEl.reset();
    bannerPreviewImg.src = "../../public/assets/image/movie_banner_default.jpg";
    posterPreviewImg.src = "../../public/assets/image/movie_poster_default.jpg";

    // Ẩn trường ID display khi Add
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

    modalTitle.textContent = "Edit Movie";
    submitBtn.textContent = "Save";

    // Hiển thị preview với data hiện tại
    bannerPreviewImg.src = movie.banner;
    posterPreviewImg.src = movie.poster;

    // Hiển thị ID (readonly)
    const idDisplayGroup = movieFormEl.querySelector(".movie-id-display");
    const idDisplayInput = movieFormEl.querySelector(
      'input[name="id-display"]'
    );
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = movie.id;
    }

    // Điền dữ liệu
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
    // Reset preview images
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

  // Upload banner mới
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

  // Upload poster mới
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

  // SUBMIT FORM - SỬA LOGIC
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
        // EDIT MODE - SỬA: Cập nhật trực tiếp vào allMovies
        const movieId = currentEditRow.dataset.movieId;
        const movieIndex = allMovies.findIndex((m) => m.id === movieId);

        if (movieIndex !== -1) {
          // Cập nhật movie trong allMovies
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

          // Gọi filterMovies để cập nhật lại filteredMovies
          // filterMovies sẽ giữ nguyên trang hiện tại
          filterMovies();
        }
      } else {
        // ADD MODE
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

        // Chuyển đến trang cuối nơi có movie mới
        currentPage = getTotalPages();
        renderMovies();
      }

      closeModal();
    }
  });
}
