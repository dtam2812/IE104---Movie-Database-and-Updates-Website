import { TMDB_API_KEY } from "../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w300";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentPage = 1;
let currentType = "movie";
let movieCardTemplate = "";
let castCardTemplate = "";

// ================== LOAD COMPONENT TEMPLATE ================== //
Promise.all([
  fetch("../components/MovieCardRender.html").then((res) => res.text()),
  fetch("../components/CastCardRender.html").then((res) => res.text()),
])
  .then(([movieHTML, castHTML]) => {
    movieCardTemplate = movieHTML;
    castCardTemplate = castHTML;
    loadResults();
  })
  .catch((err) => console.error("Không tải được component:", err));

// ================== LỌC NỘI DUNG (MOVIE / CAST) ================== //
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    currentPage = 1;
    loadResults();
  });
});

// ================== HÀM GỌI API ================== //
async function loadResults() {
  if (!movieCardTemplate || !castCardTemplate) return;

  grid.innerHTML = "<p>Đang tải...</p>";
  try {
    const url =
      currentType === "movie"
        ? `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`
        : `${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`;

    const res = await fetch(url);
    const data = await res.json();
    renderResults(data.results);
    renderPagination(data.page, data.total_pages);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu tìm kiếm:", err);
    grid.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

// ================== RENDER KẾT QUẢ ================== //
function renderResults(results) {
  grid.innerHTML = "";
  if (!results || results.length === 0) {
    grid.innerHTML = "<p>Không tìm thấy kết quả.</p>";
    return;
  }

  results.forEach((item) => {
    if (currentType === "movie") {
      // --- Ảnh poster ---
      const poster = item.poster_path
        ? `${IMG_URL}${item.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const title = item.title || "Không rõ";
      const original_title = item.original_title || "";

      let cardHTML = movieCardTemplate
        .replace(/{{id}}/g, item.id)
        .replace(/{{poster}}/g, poster)
        .replace(/{{title}}/g, title)
        .replace(/{{original_title}}/g, original_title);

      grid.insertAdjacentHTML("beforeend", cardHTML);
    } else {
      // --- Ảnh diễn viên ---
      const profile = item.profile_path
        ? `${IMG_URL}${item.profile_path}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            item.name || "Unknown"
          )}&size=300&background=1a1a2e&color=0891b2`;

      const name = item.name || "Không rõ";
      const original_name = item.original_name || "";

      let cardHTML = castCardTemplate
        .replace(/{{id}}/g, item.id)
        .replace(/{{profile_path}}/g, profile)
        .replace(/{{name}}/g, name)
        .replace(/{{original_name}}/g, original_name);

      grid.insertAdjacentHTML("beforeend", cardHTML);
    }
  });
}

// ================== PHÂN TRANG ================== //
function renderPagination(page, total) {
  pagination.innerHTML = "";
  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-container");

  // Nút Previous
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-arrow");
  prevBtn.innerHTML = "&#8592;";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadResults();
    }
  });

  // Text "Trang X / Y"
  const pageInfo = document.createElement("span");
  pageInfo.classList.add("page-info");
  pageInfo.textContent = `Trang ${page} / ${total}`;

  // Nút Next
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-arrow");
  nextBtn.innerHTML = "&#8594;";
  nextBtn.disabled = page === total;
  nextBtn.addEventListener("click", () => {
    if (currentPage < total) {
      currentPage++;
      loadResults();
    }
  });

  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(nextBtn);
  pagination.appendChild(container);
}
