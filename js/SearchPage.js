import { TMDB_API_KEY } from "../config.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "all";
let allResults = [];
let cachedResults = {};
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
  grid.innerHTML = "<p>Đang tải...</p>";
  const currentPage = currentPages[type];
  const cacheKey = `${type}_${currentPage}`;

  // 🚫 KHÔNG dùng cache cho "all"
  if (type !== "all" && cachedResults[cacheKey]) {
    allResults = cachedResults[cacheKey].results;
    renderResults();
    renderPagination(currentPage, cachedResults[cacheKey].totalPages, type);
    return;
  }

  try {
    let results = [];
    let totalPages = 1;

    if (type === "all") {
      console.log("🔄 Fetching BOTH movie + tv...");
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

      console.log("🎬 Movies:", movieData.results?.length);
      console.log("📺 TV shows:", tvData.results?.length);

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
      cachedResults[cacheKey] = { results: results.slice(0, 18), totalPages };
    }

    allResults = results.slice(0, 18);
    console.log(
      "✅ Final merged results:",
      allResults.map((r) => r.media_type)
    );
    renderResults();
    renderPagination(currentPage, totalPages, type);
  } catch (err) {
    console.error("❌ Lỗi load:", err);
    grid.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.type;
    loadResults(currentFilter);
  });
});

function renderResults() {
  grid.innerHTML = "";

  if (!allResults.length) {
    grid.innerHTML = "<p>Không tìm thấy kết quả.</p>";
    return;
  }

  allResults.forEach((item) => {
    if (item.media_type === "movie") renderMovieCard(item);
    else if (item.media_type === "tv") renderTvCard(item);
    else if (item.media_type === "person") renderPersonCard(item);
  });
}

function renderMovieCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";

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
    : "https://via.placeholder.com/300x450?text=No+Image";

  const html = tvCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, item.name || "Không rõ")
    .replace(/{{original_title}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

function renderPersonCard(item) {
  const profilePath = item.profile_path
    ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
    : "";

  // Nếu có template, dùng nó
  if (castCardTemplate) {
    const html = castCardTemplate
      .replace(/{{id}}/g, item.id)
      .replace(/{{profile_path}}/g, profilePath)
      .replace(/{{name}}/g, item.name || "Không rõ")
      .replace(/{{original_name}}/g, item.original_name || "");

    grid.insertAdjacentHTML("beforeend", html);
  } else {
    // Fallback: tạo bằng JavaScript
    const cardDiv = document.createElement("div");
    cardDiv.className = "cast-box";

    const link = document.createElement("a");
    link.className = "cast-card";
    link.href = `../pages/cast.html?id=${item.id}`;

    const imageDiv = document.createElement("div");
    imageDiv.className = "cast-img";

    if (profilePath) {
      const img = document.createElement("img");
      img.src = profilePath;
      img.alt = item.name;
      imageDiv.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "avatar-fallback";
      fallback.textContent = (item.name?.[0] || "?").toUpperCase();
      imageDiv.appendChild(fallback);
    }

    link.appendChild(imageDiv);

    const infoDiv = document.createElement("div");
    infoDiv.className = "info";

    const nameH4 = document.createElement("h4");
    nameH4.className = "name";
    const nameLink = document.createElement("a");
    nameLink.href = `../pages/cast.html?id=${item.id}`;
    nameLink.textContent = item.name || "Không rõ";
    nameH4.appendChild(nameLink);

    const otherNameH4 = document.createElement("h4");
    otherNameH4.className = "other-name";
    const otherNameLink = document.createElement("a");
    otherNameLink.href = "#";
    otherNameLink.textContent = item.original_name || "";
    otherNameH4.appendChild(otherNameLink);

    infoDiv.appendChild(nameH4);
    if (item.original_name) {
      infoDiv.appendChild(otherNameH4);
    }

    cardDiv.appendChild(link);
    cardDiv.appendChild(infoDiv);
    grid.appendChild(cardDiv);
  }
}

function renderPagination(page, total, type) {
  pagination.innerHTML = "";
  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-container");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-arrow");
  prevBtn.innerHTML = "&#8592;";
  prevBtn.disabled = page === 1;
  prevBtn.onclick = () => {
    if (currentPages[type] > 1) {
      currentPages[type]--;
      loadResults(type);
    }
  };

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-arrow");
  nextBtn.innerHTML = "&#8594;";
  nextBtn.disabled = page === total;
  nextBtn.onclick = () => {
    if (currentPages[type] < total) {
      currentPages[type]++;
      loadResults(type);
    }
  };

  const info = document.createElement("span");
  info.classList.add("page-info");
  info.textContent = `Trang ${page} / ${total}`;

  container.append(prevBtn, info, nextBtn);
  pagination.appendChild(container);
}
