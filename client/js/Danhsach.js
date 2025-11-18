// Cấu hình API
const API_KEY = "8d7f1f7ef4ead0588ee2c66d06f75799";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w300";
const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

let LANGUAGE = getLang(); // ← Đã đổi thành động như file1

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

function getLang() {
  const lang =
    localStorage.getItem("language") || document.documentElement.lang || "vi";
  return lang === "vi" ? "vi-VN" : "en-US";
}

// Khi người dùng đổi ngôn ngữ (Translate.js sẽ dispatch event "languagechange")
window.addEventListener("languagechange", (e) => {
  LANGUAGE = getLang(); // cập nhật lại ngôn ngữ cho TMDB API
  currentPage = 1; // về trang 1 để tránh lỗi trang không tồn tại
  render(); // render lại toàn bộ danh sách với ngôn ngữ mới
});

// Khai báo các DOM hay dùng
const filterToggle = document.querySelector(".filter__toggle");
const filterSelect = document.querySelector(".filter__select");
const faFilter = document.querySelector(".fa-solid.fa-filter");
const filterCloseBtn = document.querySelector(".filter__close-btn");
const filterBtn = document.querySelector(".filter__select-btn");

const selectListItemCountry = document.querySelectorAll(
  ".filter__select-list.country .filter__select-list-item"
);
const selectListItemCountryAll = document.querySelector(
  ".filter__select-list.country .all"
);
const itemMovieType = document.querySelectorAll(
  ".filter__select-list.movie-type .filter__select-list-item"
);
const itemMovieGenre = document.querySelectorAll(
  ".filter__select-list.movie-genre .filter__select-list-item"
);
const itemMovieGenreAll = document.querySelector(
  ".filter__select-list.movie-genre .all"
);
const itemArrange = document.querySelectorAll(
  ".filter__select-list.arrange .filter__select-list-item"
);

const movieContainer = document.querySelector(".movie");
const pageCurrentSpan = document.querySelector(".pagination-page-current");
const pageTotalSpan = document.querySelector(
  ".pagination__main span:last-child"
);
const leftPag = document.querySelector(".pagination-left-arrow");
const rightPag = document.querySelector(".pagination-right-arrow");

// Ẩn hiện filter toggle
filterToggle.addEventListener("click", () => {
  filterSelect.classList.toggle("hidden");
  faFilter.classList.toggle("fa-filter-active");
});

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

itemMovieGenreAll.addEventListener("click", () => {
  itemMovieGenre.forEach((current) => {
    current.classList.remove("filter__select--active");
  });
  itemMovieGenreAll.classList.add("filter__select--active");
});

itemMovieGenre.forEach((current) => {
  current.addEventListener("click", () => {
    itemMovieGenreAll.classList.remove("filter__select--active");
    current.classList.toggle("filter__select--active");
    checkGenreLastActive();
  });
});

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

// Khởi tạo danh sách phim
async function initApp() {
  try {
    const [movieResponse, tvResponse] = await Promise.all([
      fetch("../components/MovieCardRender.html"),
      fetch("../components/TvShowCardRender.html"),
    ]);

    movieCardTemplate = await movieResponse.text();
    tvShowCardTemplate = await tvResponse.text();

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

    const movie10 = movieData.results.slice(0, 10);
    const tv10 = tvData.results.slice(0, 10);

    let mergeAll = [...movie10, ...tv10];

    if (movie10.length !== 0 && tv10.length === 0) {
      mergeAll = movieData.results;
    } else if (movie10.length === 0 && tv10.length !== 0) {
      mergeAll = tvData.results;
    }

    // Fisher-Yates shuffle (chỉ shuffle khi có cả 2 loại)
    if (movie10.length > 0 && tv10.length > 0) {
      for (let i = mergeAll.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [mergeAll[i], mergeAll[j]] = [mergeAll[j], mergeAll[i]];
      }
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

function displayMovies(movieList) {
  const paginationElement = document.querySelector(".content__pagination");

  if (!movieList || movieList.length === 0) {
    movieContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #aaa;">
        <div style="font-size: 20px; margin-bottom: 8px;">Không có kết quả</div>
      </div>
    `;
    if (paginationElement) {
      paginationElement.style.display = "none";
    }
    return;
  }

  if (paginationElement) {
    paginationElement.style.display = "flex";
  }

  let html = "";

  for (let movie of movieList) {
    const isMovie = movie.title !== undefined;
    const movieId = movie.id;

    const movieName = isMovie
      ? movie.title || movie.original_title
      : movie.name || movie.original_name;

    const originalName = isMovie ? movie.original_title : movie.original_name;

    const posterPath = movie.poster_path
      ? IMAGE_URL + movie.poster_path
      : PLACEHOLDER_IMAGE;

    const template = isMovie ? movieCardTemplate : tvShowCardTemplate;

    let cardHtml = template
      .replace(/{{id}}/g, movieId)
      .replace(/{{poster}}/g, posterPath)
      .replace(/{{title}}/g, movieName)
      .replace(/{{original_title}}/g, originalName)
      .replace(/{{name}}/g, movieName);

    html += cardHtml;
  }

  movieContainer.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePageNumber() {
  pageCurrentSpan.textContent = currentPage;
  pageTotalSpan.textContent = totalPages;
  updatePaginationButtons();
}

filterBtn.addEventListener("click", async () => {
  const selectedCountry = document.querySelector(
    ".filter__select-list.country .filter__select--active"
  );
  const countryCode = selectedCountry.getAttribute("data-country");
  currentCountry = countryCode === "all" ? "" : countryCode;

  const selectedType = document.querySelector(
    ".filter__select-list.movie-type .filter__select--active"
  );
  currentMovieType = selectedType.getAttribute("data-type");

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

  const selectedArrange = document.querySelector(
    ".filter__select-list.arrange .filter__select--active"
  );
  currentArrange = selectedArrange.getAttribute("data-arrange");

  currentPage = 1;
  pageCurrentSpan.textContent = "1";

  filterSelect.classList.add("hidden");
  faFilter.classList.remove("fa-filter-active");

  await render();
});

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

rightPag.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});

leftPag.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});
