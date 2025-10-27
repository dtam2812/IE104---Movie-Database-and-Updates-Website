import { TMDB_API_KEY } from "../config.js";

//Lấy query từ URL
const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

//Các phần tử trên giao diện
const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentPage = 1;
let currentFilter = "multi";
let allResults = [];

// HTML
let movieCardTemplate = "";
let tvCardTemplate = "";
let castCardTemplate = "";

// Card
Promise.all([
  fetch("../components/MovieCardRender.html").then((res) => res.text()),
  fetch("../components/TvShowCardRender.html").then((res) => res.text()),
  fetch("../components/CastCardRender.html").then((res) => res.text()),
])
  .then(([movieHTML, tvHTML, castHTML]) => {
    movieCardTemplate = movieHTML;
    tvCardTemplate = tvHTML;
    castCardTemplate = castHTML;

    // Mặc định gọi "multi" để tìm được cả phim, TV và diễn viên
    loadResults("multi");
  })
  .catch((err) => console.error("Không tải được component:", err));

// Hàm gọi API theo loại
async function loadResults(type = "multi") {
  grid.innerHTML = "<p>Đang tải...</p>";

  let endpoint = "";
  if (type === "movie") {
    endpoint = "search/movie";
  } else if (type === "person") {
    endpoint = "search/person";
  } else if (type === "tv") {
    endpoint = "search/tv";
  } else {
    endpoint = "search/multi";
  }

  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
    query
  )}&page=${currentPage}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();

    // Giới hạn 18 kết quả 1 trang
    allResults = (data.results || []).slice(0, 18);

    renderResults(type);
    renderPagination(data.page, data.total_pages);
  } catch (err) {
    console.error("Error loading search:", err);
    grid.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

//Xử lý khi bấm nút chuyển tab (Movie / Person / TV)
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.type;
    currentPage = 1; // quay lại trang đầu
    loadResults(currentFilter);
  });
});

// Render kết quả
function renderResults(type) {
  grid.innerHTML = "";

  if (!allResults.length) {
    grid.innerHTML = "<p>Không tìm thấy kết quả.</p>";
    return;
  }

  if (type === "movie") {
    allResults.forEach(renderMovieCard);
  } else if (type === "person") {
    allResults.forEach(renderPersonCard);
  } else if (type === "tv") {
    allResults.forEach(renderTvCard);
  } else if (type === "multi") {
    //Với multi — xử lý cả 3 loại
    allResults.forEach((item) => {
      if (item.media_type === "movie") renderMovieCard(item);
      else if (item.media_type === "tv") renderTvCard(item);
      else if (item.media_type === "person") renderPersonCard(item);
    });
  }
}

//Các hàm render riêng từng loại
function renderMovieCard(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";

  const html = movieCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, item.title || item.name || "Không rõ")
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
  const profile = item.profile_path
    ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
    : "../assets/image/default-person.jpg";

  const html = castCardTemplate
    .replace(/{{id}}/g, item.id)
    .replace(/{{profile_path}}/g, profile)
    .replace(/{{name}}/g, item.name || "Không rõ")
    .replace(/{{original_name}}/g, item.original_name || "");

  grid.insertAdjacentHTML("beforeend", html);
}

// Phân trang
function renderPagination(page, total) {
  pagination.innerHTML = "";
  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-container");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-arrow");
  prevBtn.innerHTML = "&#8592;";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadResults(currentFilter);
    }
  });

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-arrow");
  nextBtn.innerHTML = "&#8594;";
  nextBtn.disabled = page === total;
  nextBtn.addEventListener("click", () => {
    if (currentPage < total) {
      currentPage++;
      loadResults(currentFilter);
    }
  });

  const pageInfo = document.createElement("span");
  pageInfo.classList.add("page-info");
  pageInfo.textContent = `Trang ${page} / ${total}`;

  container.append(prevBtn, pageInfo, nextBtn);
  pagination.appendChild(container);
}
