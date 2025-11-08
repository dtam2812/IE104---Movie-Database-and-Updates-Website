// Cấu hình API
const API_KEY = "8d7f1f7ef4ead0588ee2c66d06f75799";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w300";
const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
const LANGUAGE = "vi-VN";

// Lưu thông tin filter hiện tại
let currentPage = 1;
let currentMovieType = "all";
let currentCountry = "";
let currentGenre = [];
let currentArrange = "new";
let totalPages = 100;

// Template Card cho movie và tvShows
let movieCardTemplate = "";
let tvShowCardTemplate = "";

// Genres chỉ dành cho phim lẻ và phim bộ
const movieOnlyGenres = [
  "28",
  "12",
  "14",
  "36",
  "27",
  "10402",
  "10749",
  "878",
  "53",
  "10752",
];
const tvOnlyGenres = [
  "10759",
  "10762",
  "10763",
  "10764",
  "10765",
  "10766",
  "10767",
  "10768",
];

// Khai báo các DOM hay dùng

// Các DOM bên trong bộ lọc
const filterToggle = document.querySelector(".filter__toggle"); // Nút "Bộ lọc"
const filterSelect = document.querySelector(".filter__select"); // Toàn bộ bộ lọc khi mở
const faFilter = document.querySelector(".fa-solid.fa-filter"); // Icon filter bên cạnh chữ "Bộ lọc"
const filterCloseBtn = document.querySelector(".filter__close-btn"); // Nút "Đóng"
const filterBtn = document.querySelector(".filter__select-btn"); // Nút "Lọc kết quả"

const selectListItemCountry = document.querySelectorAll(
  ".filter__select-list.country .filter__select-list-item"
); // Danh sách các item trong mục "Quốc gia"
const selectListItemCountryAll = document.querySelector(
  ".filter__select-list.country .all"
); // Item "Tất cả" trong mục "Quốc gia"
const itemMovieType = document.querySelectorAll(
  ".filter__select-list.movie-type .filter__select-list-item"
); // Danh sách các item trong mục "Loại phim"
const itemMovieGenre = document.querySelectorAll(
  ".filter__select-list.movie-genre .filter__select-list-item"
); // Danh sách các item trong mục "Thể loại"
const itemMovieGenreAll = document.querySelector(
  ".filter__select-list.movie-genre .all"
); // Item "Tất cả" trong mục "Thể loại"
const itemArrange = document.querySelectorAll(
  ".filter__select-list.arrange .filter__select-list-item"
); // Danh sách các item trong mục "Sắp xếp"

// Các DOM phần khung phim và phân trang
const movieContainer = document.querySelector(".movie"); // Khung chứa các phim
const pageCurrentSpan = document.querySelector(".pagination-page-current"); // Số trang hiện tại
const pageTotalSpan = document.querySelector(
  ".pagination__main span:last-child"
); // Tổng số trang
const leftPag = document.querySelector(".pagination-left-arrow"); // Nút chuyển về trang trước
const rightPag = document.querySelector(".pagination-right-arrow"); // Nút chuyển ra trang sau

// Ẩn hiện filter toggle
filterToggle.addEventListener("click", () => {
  filterSelect.classList.toggle("hidden");
  faFilter.classList.toggle("fa-filter-active");
});

// Đóng filter toggle khi click nút "Lọc kết quả"
filterCloseBtn.addEventListener("click", () => {
  filterSelect.classList.add("hidden");
  faFilter.classList.remove("fa-filter-active");
});

// Active 1 item duy nhất trong mục "Quốc gia"
selectListItemCountry.forEach((current) => {
  current.addEventListener("click", () => {
    const currentActive = document.querySelector(
      ".filter__select-list.country .filter__select--active"
    );
    if (currentActive) {
      currentActive.classList.remove("filter__select--active");
    }
    current.classList.add("filter__select--active");
  });
});

// Hàm thay đổi các item "Thể loại" tương ứng với từng "Loại phim"
function updateGenreVisibility(type) {
  const allGenreItems = document.querySelectorAll(
    ".filter__select-list.movie-genre .filter__select-list-item"
  );

  allGenreItems.forEach((item) => {
    const genreId = item.getAttribute("data-genre");

    if (genreId === "all") return;

    // Nếu "Loại phim" là phim lẻ thì ẩn các item chỉ có ở phim bộ, là phim bộ thì ẩn các item chỉ có ở phim lẻ, là tất cả thì hiện hết
    if (type === "movie") {
      if (tvOnlyGenres.includes(genreId)) {
        item.classList.add("hidden");
        item.classList.remove("filter__select--active");
      } else {
        item.classList.remove("hidden");
      }
    } else if (type === "tv") {
      if (movieOnlyGenres.includes(genreId)) {
        item.classList.add("hidden");
        item.classList.remove("filter__select--active");
      } else {
        item.classList.remove("hidden");
      }
    } else {
      item.classList.remove("hidden");
    }
  });

  checkGenreLastActive();
}

// Hàm active item "Tất cả" nếu không còn item nào active trong mục "Thể loại"
function checkGenreLastActive() {
  const lastActive = document.querySelector(
    ".filter__select-list.movie-genre .filter__select--active"
  );

  if (!lastActive) {
    itemMovieGenreAll.classList.add("filter__select--active");
  }
}

// Active 1 item duy nhất trong mục "Loại phim"
itemMovieType.forEach((current) => {
  current.addEventListener("click", () => {
    const itemMovieTypeActive = document.querySelector(
      ".filter__select-list.movie-type .filter__select--active"
    );

    if (current !== itemMovieTypeActive) {
      current.classList.add("filter__select--active");
      itemMovieTypeActive.classList.remove("filter__select--active");

      const selectedType = current.getAttribute("data-type");
      updateGenreVisibility(selectedType);
    }
  });
});

// Active item "Tất cả" sẽ xoá active của các item khác trong "Thể loại"
itemMovieGenreAll.addEventListener("click", () => {
  itemMovieGenre.forEach((current) => {
    current.classList.remove("filter__select--active");
  });
  itemMovieGenreAll.classList.add("filter__select--active");
});

// Cho phép active nhiều item trừ item "Tất cả" trong mục "Thể loại"
itemMovieGenre.forEach((current) => {
  current.addEventListener("click", () => {
    itemMovieGenreAll.classList.remove("filter__select--active");
    current.classList.toggle("filter__select--active");

    checkGenreLastActive();
  });
});

// Active 1 item trong mục "Sắp xếp"
itemArrange.forEach((current) => {
  current.addEventListener("click", () => {
    const itemArrangeActive = document.querySelector(
      ".filter__select-list.arrange .filter__select--active"
    );

    if (itemArrangeActive !== current) {
      current.classList.add("filter__select--active");
      itemArrangeActive.classList.remove("filter__select--active");
    }
  });
});

// Hàm lấy params từ URL
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    type: params.get("type"),
    genre: params.get("genre"),
    country: params.get("country"),
  };
}

// Reset tất cả các mục trong filter về mặc định
function resetFiltersToDefault() {
  // Active item "Tất cả" trong mục "Quốc gia"
  selectListItemCountry.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  selectListItemCountryAll.classList.add("filter__select--active");

  // Active item "Tất cả" trong mục "Loại phim"
  itemMovieType.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  document
    .querySelector('.filter__select-list.movie-type [data-type="all"]')
    .classList.add("filter__select--active");

  // Active item "Tất cả" trong mục "Thể loại"
  itemMovieGenre.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  itemMovieGenreAll.classList.add("filter__select--active");

  // Active item "Mới nhất" trong mục "Sắp xếp"
  itemArrange.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  document
    .querySelector('.filter__select-list.arrange [data-arrange="new"]')
    .classList.add("filter__select--active");

  // Reset filter
  currentMovieType = "all";
  currentCountry = "";
  currentGenre = [];
  currentArrange = "new";
  currentPage = 1;

  updateGenreVisibility("all");
}

// Hàm áp dụng params từ URL
function applyUrlParams() {
  const params = getUrlParams();

  resetFiltersToDefault();

  // Active theo "Loại phim" tương ứng lấy từ URL
  if (params.type) {
    currentMovieType = params.type;

    itemMovieType.forEach((item) => {
      item.classList.remove("filter__select--active");
    });

    const targetType = document.querySelector(
      `.filter__select-list.movie-type [data-type="${params.type}"]`
    );
    if (targetType) {
      targetType.classList.add("filter__select--active");
    }

    updateGenreVisibility(params.type);
  }

  // Active theo "Thể loại" tương ứng lấy từ URL
  if (params.genre) {
    currentGenre = [params.genre];

    itemMovieGenreAll.classList.remove("filter__select--active");

    const targetGenre = document.querySelector(
      `.filter__select-list.movie-genre [data-genre="${params.genre}"]`
    );
    if (targetGenre) {
      targetGenre.classList.add("filter__select--active");
    }
  }

  // Active theo "Quốc gia" tương ứng lấy từ URL
  if (params.country) {
    currentCountry = params.country;

    selectListItemCountryAll.classList.remove("filter__select--active");

    const targetCountry = document.querySelector(
      `.filter__select-list.country [data-country="${params.country}"]`
    );
    if (targetCountry) {
      targetCountry.classList.add("filter__select--active");
    }
  }
}

// Khởi tạo danh sách phim
async function initApp() {
  try {
    // Load 2 khung hiển thị cho phim lẻ và phim bộ
    const [movieResponse, tvResponse] = await Promise.all([
      fetch("../components/MovieCardRender.html"),
      fetch("../components/TvShowCardRender.html"),
    ]);

    movieCardTemplate = await movieResponse.text();
    tvShowCardTemplate = await tvResponse.text();

    // Nếu là mục "Bộ lọc" thì mở filter toggle
    const params = getUrlParams();
    const isFilterNav =
      params.type === "all" && !params.genre && !params.country;

    if (isFilterNav) {
      filterSelect.classList.remove("hidden");
      faFilter.classList.add("fa-filter-active");
    }

    applyUrlParams();

    await render();
  } catch (error) {
    console.log("Lỗi load template:", error);
  }
}

initApp();

// Render phim theo "Loại phim"
async function render() {
  try {
    if (currentMovieType === "all") {
      await renderBothMovieAndTV();
    } else {
      await renderOneType();
    }
  } catch (error) {
    console.log("Lỗi render:", error);
  }
}

// Render 1 loại là phim lẻ hoặc phim bộ
async function renderOneType() {
  try {
    const apiUrl = createApiUrl(currentMovieType, currentPage);

    const response = await fetch(apiUrl);
    const data = await response.json();

    const movieList = data.results;
    totalPages = Math.min(data.total_pages, 100);
    updatePageNumber();
    displayMovies(movieList);
  } catch (error) {
    console.log("Lỗi:", error);
    throw error;
  }
}

// Render cả phim lẻ và phim bộ
async function renderBothMovieAndTV() {
  try {
    const movieApiUrl = createApiUrl("movie", currentPage);
    const tvApiUrl = createApiUrl("tv", currentPage);

    const [movieResponse, tvResponse] = await Promise.all([
      fetch(movieApiUrl),
      fetch(tvApiUrl),
    ]);

    const movieData = await movieResponse.json();
    const tvData = await tvResponse.json();

    // Lấy 10 phim đầu mỗi loại rồi trộn theo thuật toán xào bài Fisher-Yates
    const movie10 = movieData.results.slice(0, 10);
    const tv10 = tvData.results.slice(0, 10);
    let mergeAll = [...movie10, ...tv10];

    // Nếu chỉ có một loại thì dùng toàn bộ kết quả của loại đó
    if (movie10.length !== 0 && tv10.length == 0) {
      mergeAll = movieData.results;
    } else if (movie10.length == 0 && tv10.length !== 0) {
      mergeAll = tvData.results;
    }

    for (let i = mergeAll.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = mergeAll[i];
      mergeAll[i] = mergeAll[j];
      mergeAll[j] = temp;
    }

    const maxPages = Math.max(movieData.total_pages, tvData.total_pages);
    totalPages = Math.min(maxPages, 100);

    updatePageNumber();
    displayMovies(mergeAll);
  } catch (error) {
    console.log("Lỗi:", error);
    throw error;
  }
}

// Tạo API theo bộ lọc người dùng chọn
function createApiUrl(type, page) {
  let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`;

  if (currentGenre.length > 0) {
    url += `&with_genres=${currentGenre.join(",")}`;
  }

  if (currentCountry) {
    url += `&with_origin_country=${currentCountry}`;
  }

  if (currentArrange === "new") {
    if (type === "movie") {
      url += "&sort_by=release_date.desc";
    } else {
      url += "&sort_by=first_air_date.desc";
    }
  } else if (currentArrange === "imdb") {
    url += "&sort_by=vote_average.desc&vote_count.gte=100";
  } else if (currentArrange === "popular") {
    url += "&sort_by=popularity.desc";
  }

  return url;
}

// Movie-card-render
function displayMovies(movieList) {
  const paginationElement = document.querySelector(".content__pagination");

  // Kiểm tra nếu không có kết quả
  if (!movieList || movieList.length === 0) {
    movieContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #aaa;">
        <div style="font-size: 20px; margin-bottom: 8px;">Không có kết quả</div>
      </div>
    `;
    // Ẩn pagination
    if (paginationElement) {
      paginationElement.style.display = "none";
    }
    return;
  }

  // Hiện pagination nếu có kết quả
  if (paginationElement) {
    paginationElement.style.display = "flex";
  }

  let html = "";

  for (let i = 0; i < movieList.length; i++) {
    const movie = movieList[i];

    // Xác định phim lẻ hay phim bộ
    const isMovie = movie.title !== undefined;
    const movieId = movie.id;
    const movieName = isMovie ? movie.title : movie.name;
    const originalName = isMovie ? movie.original_title : movie.original_name;

    // Xử lý poster: Nếu không có thì dùng placeholder
    const posterPath = movie.poster_path
      ? IMAGE_URL + movie.poster_path
      : PLACEHOLDER_IMAGE;

    // Chọn khung phù hợp
    const template = isMovie ? movieCardTemplate : tvShowCardTemplate;

    // Replace các giá trị
    let cardHtml = template
      .replace(/{{id}}/g, movieId)
      .replace(/{{poster}}/g, posterPath)
      .replace(/{{title}}/g, movieName)
      .replace(/{{original_title}}/g, originalName)
      .replace(/{{name}}/g, movieName); // Khung cho phim bộ

    html += cardHtml;
  }

  movieContainer.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== CẬP NHẬT SỐ TRANG - ĐÃ SỬA ====================
function updatePageNumber() {
  pageCurrentSpan.textContent = currentPage;
  pageTotalSpan.textContent = totalPages; // Bỏ dấu "/" vì CSS sẽ tự thêm
  updatePaginationButtons();
}
// ==================== HẾT PHẦN SỬA ====================

// DOM khi người dùng click nút "Lọc kết quả"
filterBtn.addEventListener("click", async () => {
  // Lọc theo mục "Quốc gia" đã chọn
  const selectedCountry = document.querySelector(
    ".filter__select-list.country .filter__select--active"
  );
  const countryCode = selectedCountry.getAttribute("data-country");
  currentCountry = countryCode === "all" ? "" : countryCode;

  // Lọc theo mục "Loại phim" đã chọn
  const selectedType = document.querySelector(
    ".filter__select-list.movie-type .filter__select--active"
  );
  currentMovieType = selectedType.getAttribute("data-type");

  // Lọc theo mục "Thể loại" đã chọn
  const selectedGenres = document.querySelectorAll(
    ".filter__select-list.movie-genre .filter__select--active"
  );
  currentGenre = [];
  selectedGenres.forEach((item) => {
    const genreId = item.getAttribute("data-genre");
    if (genreId !== "all") {
      currentGenre.push(genreId);
    }
  });

  // Lọc theo mục "Sắp xếp" đã chọn
  const selectedArrange = document.querySelector(
    ".filter__select-list.arrange .filter__select--active"
  );
  currentArrange = selectedArrange.getAttribute("data-arrange");

  // Reset về trang 1
  currentPage = 1;
  pageCurrentSpan.textContent = "1";

  // Đóng filter
  filterSelect.classList.add("hidden");
  faFilter.classList.remove("fa-filter-active");

  await render();
});

// Kiểm tra xem nút sang trái sang phải có được click không
function updatePaginationButtons() {
  if (currentPage <= 1) {
    leftPag.classList.add("disable");
  } else {
    leftPag.classList.remove("disable");
  }

  if (currentPage >= totalPages) {
    rightPag.classList.add("disable");
  } else {
    rightPag.classList.remove("disable");
  }
}

// Click nút sang trang tiếp theo
rightPag.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});

// Click quay về trang trước
leftPag.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});
