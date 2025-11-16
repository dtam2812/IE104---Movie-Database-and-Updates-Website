import { TMDB_API_KEY } from "../../config.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "movie";
let allResults = [];
let currentPages = { all: 1, movie: 1, tv: 1, person: 1 };

let movieCardTemplate = "";
let tvCardTemplate = "";
let castCardTemplate = "";

/* ---------------------------------------------------
   🔥 THÊM MỚI — HÀM LẤY TÊN PHIM THEO NGÔN NGỮ
--------------------------------------------------- */
function getLocalizedTitle(item) {
  const lang = document.documentElement.lang || "vi";

  if (item.media_type === "movie") {
    return lang === "vi"
      ? (item.title || item.original_title || "Không rõ")
      : (item.original_title || item.title || "Unknown");
  }

  if (item.media_type === "tv") {
    return lang === "vi"
      ? (item.name || item.original_name || "Không rõ")
      : (item.original_name || item.name || "Unknown");
  }

  return item.name || item.original_name || "Unknown";
}

// ===================================================

Promise.all([
  fetch("../components/MovieCardRender.html").then((r) => r.text()),
  fetch("../components/TvShowCardRender.html").then((r) => r.text()),
  fetch("../components/CastCardRender.html").then((r) => r.text()),
])
  .then(([movieHTML, tvHTML, castHTML]) => {
    movieCardTemplate = movieHTML.trim();
    tvCardTemplate = tvHTML.trim();
    castCardTemplate = castHTML.trim();
    loadResults(currentFilter);
  })
  .catch((err) => console.error("Không tải được component:", err));

// Hàm load dữ liệu từ TMDB
async function loadResults(type = "movie") {
  grid.innerHTML = "<p class='placeholder-text' data-i18n='search.loading'>Đang tải...</p>";
  const currentPage = currentPages[type];

  try {
    let results = [];
    let totalPages = 1;

    if (type === "all") {
      const [movieRes, tvRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`
        ),
        fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`
        ),
      ]);

      const [movieData, tvData] = await Promise.all([
        movieRes.json(),
        tvRes.json(),
      ]);

      const movies = (movieData.results || []).map((item) => ({
        ...item,
        media_type: "movie",
      }));
      const tvShows = (tvData.results || []).map((item) => ({
        ...item,
        media_type: "tv",
      }));

      results = [...movies, ...tvShows].sort(
        (a, b) => (b.popularity || 0) - (a.popularity || 0)
      );
      totalPages = Math.max(movieData.total_pages, tvData.total_pages);
    } else {
      const endpoint = {
        movie: "search/movie",
        tv: "search/tv",
        person: "search/person",
      }[type];

      const res = await fetch(
        `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
          query
        )}&page=${currentPage}`
      );

      const data = await res.json();
      results = (data.results || []).map((item) => ({
        ...item,
        media_type: type,
      }));
      totalPages = data.total_pages;
    }

    allResults = results.slice(0, 18);
    renderResults();
    renderPaginationModern(currentPage, totalPages, type);
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p class='placeholder-text' data-i18n='search.error'>Lỗi tải dữ liệu.</p>";
  }
}

// Xử lý click tab
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.type;
    currentPages[currentFilter] = 1;
    loadResults(currentFilter);
  });
});

// Render kết quả
function renderResults() {
  grid.innerHTML = "";

  if (!allResults.length) {
    grid.innerHTML = "<p class='placeholder-text' data-i18n='search.noResults'>Không tìm thấy kết quả.</p>";
    return;
  }

  allResults.forEach((item) => {
    if (item.media_type === "movie") renderMovieCard(item);
    else if (item.media_type === "tv") renderTvCard(item);
    else if (item.media_type === "person") renderPersonCard(item);
  });
}

// Render card
function renderMovieCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  /* 🔥 THAY THẾ TỐI THIỂU: chỉ sửa {{title}} để dùng hàm mới */
  const html = movieCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, getLocalizedTitle(item))
    .replace(/{{original_title}}/g, item.original_title || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderTvCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  /* 🔥 THAY THẾ TỐI THIỂU: chỉ sửa {{title}} */
  const html = tvCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, getLocalizedTitle(item))
    .replace(/{{original_title}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderPersonCard(item) {
  const profilePath = item.profile_path
    ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        item.name || "Unknown"
      )}&size=300&background=1a1a2e&color=0891b2`;

  const html = castCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{profile_path}}/g, profilePath)
    .replace(/{{name}}/g, item.name || "Không rõ")
    .replace(/{{original_name}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

// Modern Pagination
function renderPaginationModern(page, total, type) {
  const oldPagination = document.querySelector(".pagination-modern");
  if (oldPagination) oldPagination.remove();

  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-modern");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-circle");
  prevBtn.innerHTML = "&#8592;";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPages[type] > 1) {
      currentPages[type]--;
      loadResults(type);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  const pageBox = document.createElement("div");
  pageBox.classList.add("page-info-box");
  pageBox.innerHTML = `
    <span class="page-text" data-i18n="search.page">Trang</span>
    <span class="page-current">${page}</span>
    <span class="page-divider">/</span>
    <span class="page-total">${total}</span>
  `;

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-circle");
  nextBtn.innerHTML = "&#8594;";
  nextBtn.disabled = page === total;
  nextBtn.addEventListener("click", () => {
    if (currentPages[type] < total) {
      currentPages[type]++;
      loadResults(type);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  container.append(prevBtn, pageBox, nextBtn);
  pagination.after(container);
}

// Lắng nghe sự kiện đổi ngôn ngữ
window.addEventListener('languagechange', () => {
  console.log('🔄 Language changed, reloading results...');
  loadResults(currentFilter);
});