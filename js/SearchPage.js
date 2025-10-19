import { TMDB_API_KEY } from "../config.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("query") || "";
document.getElementById("query-text").textContent = query;

const grid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentPage = 1;
let currentType = "movie";
let movieCardTemplate = "";

// 🔹 Load MovieCardRender.html trước
fetch("../components/MovieCardRender.html")
  .then((res) => res.text())
  .then((html) => {
    movieCardTemplate = html;
    loadResults(); // chỉ gọi sau khi có template
  })
  .catch((err) => console.error("Không tải được MovieCardRender:", err));

// 🔹 Lắng nghe nút lọc
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    currentPage = 1;
    loadResults();
  });
});

// 🔹 Hàm gọi API
async function loadResults() {
  if (!movieCardTemplate) return;

  grid.innerHTML = "<p>Đang tải...</p>";
  try {
    const url =
      currentType === "movie"
        ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`
        : `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}&page=${currentPage}`;

    const res = await fetch(url);
    const data = await res.json();
    renderResults(data.results);
    renderPagination(data.page, data.total_pages);
  } catch (err) {
    console.error("Error loading search:", err);
    grid.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

// 🔹 Render từng card bằng component
function renderResults(results) {
  grid.innerHTML = "";
  if (!results || results.length === 0) {
    grid.innerHTML = "<p>Không tìm thấy kết quả.</p>";
    return;
  }

  results.forEach((item) => {
    const poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : item.profile_path
      ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";

    const title = item.title || item.name || "Không rõ";
    const original_title = item.original_title || item.original_name || "";
    const type = currentType === "movie" ? "Movie" : "Actor";

    let cardHTML = movieCardTemplate
      .replace(/{{id}}/g, item.id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original_title)
      .replace(/{{type}}/g, type);

    grid.insertAdjacentHTML("beforeend", cardHTML);
  });
}

// 🔹 Phân trang
function renderPagination(page, total) {
  pagination.innerHTML = "";
  if (total <= 1) return;

  const createBtn = (num) => {
    const btn = document.createElement("button");
    btn.classList.add("page-btn");
    if (num === page) btn.classList.add("active");
    btn.textContent = num;
    btn.addEventListener("click", () => {
      currentPage = num;
      loadResults();
    });
    pagination.appendChild(btn);
  };

  const start = Math.max(1, page - 1);
  const end = Math.min(total, page + 1);

  for (let i = start; i <= end; i++) createBtn(i);
}
