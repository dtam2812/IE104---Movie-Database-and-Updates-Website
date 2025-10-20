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
let castCardTemplate = "";

// 🔹 Load cả 2 template (MovieCard + CastCard)
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
  if (!movieCardTemplate || !castCardTemplate) return;

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
    console.log(data);
    renderResults(data.results);
    renderPagination(data.page, data.total_pages);
  } catch (err) {
    console.error("Error loading search:", err);
    grid.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

// 🔹 Render kết quả
function renderResults(results) {
  grid.innerHTML = "";
  if (!results || results.length === 0) {
    grid.innerHTML = "<p>Không tìm thấy kết quả.</p>";
    return;
  }

  results.forEach((item) => {
    if (currentType === "movie") {
      const poster = item.poster_path
        ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

      const title = item.title || "Không rõ";
      const original_title = item.original_title || "";

      let cardHTML = movieCardTemplate
        .replace(/{{id}}/g, item.id)
        .replace(/{{poster}}/g, poster)
        .replace(/{{title}}/g, title)
        .replace(/{{original_title}}/g, original_title);

      grid.insertAdjacentHTML("beforeend", cardHTML);
    } else {
      // 🔹 Nếu không có profile_path thì dùng ảnh trong thư mục public
      const profile =
        item.profile_path && item.profile_path !== "null"
          ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
          : "../assets/image/8f1ca2029e2efceebd22fa05cca423d7.jpg";

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
