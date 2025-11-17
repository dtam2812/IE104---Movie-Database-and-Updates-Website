import { TMDB_API_KEY } from "../../config.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".searchPage__filterBtn");

let currentFilter = "all";
let allResults = [];
let currentPages = { all: 1, movie: 1, tv: 1, person: 1 };

let movieCardTemplate = "";
let tvCardTemplate = "";
let castCardTemplate = "";

Promise.all([
  fetch("../components/MovieCardRender.html").then((r) => r.text()),
  fetch("../components/TvShowCardRender.html").then((r) => r.text()),
  fetch("../components/CastCardRender.html").then((r) => r.text()),
])
  .then(([movieHTML, tvHTML, castHTML]) => {
    movieCardTemplate = movieHTML.trim();
    tvCardTemplate = tvHTML.trim();
    castCardTemplate = castHTML.trim();
    loadResults("all");
  })
  .catch((err) => console.error("Không tải được component:", err));

async function loadResults(type = "all") {
  grid.innerHTML = `<p class="searchPage__placeholder">Đang tải...</p>`;
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
    renderPagination(currentPage, totalPages, type);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="searchPage__placeholder">Lỗi tải dữ liệu.</p>`;
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) =>
      b.classList.remove("searchPage__filterBtn--active")
    );
    btn.classList.add("searchPage__filterBtn--active");

    currentFilter = btn.dataset.type;
    currentPages[currentFilter] = 1;
    loadResults(currentFilter);
  });
});

function renderResults() {
  grid.innerHTML = "";

  if (!allResults.length) {
    grid.innerHTML = `<p class="searchPage__placeholder">Không tìm thấy kết quả.</p>`;
    return;
  }

  allResults.forEach((item) => {
    if (item.media_type === "movie") renderMovieCard(item);
    else if (item.media_type === "tv") renderTvCard(item);
    else if (item.media_type === "person") renderCastCard(item);
  });
}

function renderMovieCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450?text=No+Poster";

  const html = movieCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, item.title || "Không rõ")
    .replace(/{{original_title}}/g, item.original_title || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderTvCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450?text=No+Poster";

  const html = tvCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, item.name || "Không rõ")
    .replace(/{{original_title}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderCastCard(item) {
  const profile = item.profile_path
    ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`;

  const html = castCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{profile_path}}/g, profile)
    .replace(/{{name}}/g, item.name || "Không rõ")
    .replace(/{{original_name}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderPagination(page, total, type) {
  const old = document.querySelector(".paginationModern");
  if (old) old.remove();

  if (total <= 1) return;

  const wrapper = document.createElement("div");
  wrapper.className = "paginationModern";

  const prev = document.createElement("button");
  prev.className = "pageCircle";
  prev.innerHTML = "&#8592;";
  prev.disabled = page === 1;

  prev.onclick = () => {
    if (currentPages[type] > 1) {
      currentPages[type]--;
      loadResults(type);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const info = document.createElement("div");
  info.className = "pageInfo";
  info.textContent = `Trang ${page} / ${total}`;

  const next = document.createElement("button");
  next.className = "pageCircle";
  next.innerHTML = "&#8594;";
  next.disabled = page === total;

  next.onclick = () => {
    if (currentPages[type] < total) {
      currentPages[type]++;
      loadResults(type);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  wrapper.append(prev, info, next);
  pagination.after(wrapper);
}
