import { TMDB_API_KEY } from "../../config.js";

let movieCardTemplate = "";
let tvCardTemplate = "";

// ===== THÊM MỚI: Hàm lấy ngôn ngữ =====
function getLang() {
  return localStorage.getItem("language") || document.documentElement.lang || "vi";
}

//Load 2 template HTML (Movie & TV)
Promise.all([
  fetch("../components/MovieCardRender.html").then((r) => r.text()),
  fetch("../components/TvShowCardRender.html").then((r) => r.text()),
])
  .then(([movieHtml, tvHtml]) => {
    movieCardTemplate = movieHtml;
    tvCardTemplate = tvHtml;
    loadMovieGrids(); // Bắt đầu render khi đã có template
  })
  .catch((err) => console.error("Không tải được template:", err));

// ===== SỬA HÀM createCard() =====
function createCard(item, type) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  // Xử lý title theo ngôn ngữ
  const titleDisplay = type === "tv" ? (item.name || item.original_name) : (item.title || item.original_title);
  const originalTitle = type === "tv" ? item.original_name : item.original_title;

  // Chọn template tương ứng (movie hoặc tv)
  const template = type === "tv" ? tvCardTemplate : movieCardTemplate;

  // Thay thế placeholder trong template HTML
  let cardHtml = template
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, titleDisplay)
    .replace(/{{original_title}}/g, originalTitle);

  return cardHtml;
}

//Render grid ra giao diện
function renderGrid(gridId, items = [], type = "movie") {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.warn(`Không tìm thấy grid: #${gridId}`);
    return;
  }

  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = "<p>Không có dữ liệu để hiển thị.</p>";
    return;
  }

  // Chỉ hiển thị 12 phần tử đầu tiên
  const limitedItems = items.slice(0, 12);

  limitedItems.forEach((item) => {
    const cardHTML = createCard(item, type);
    grid.insertAdjacentHTML("beforeend", cardHTML);
  });
}

//Fetch dữ liệu TMDB
async function fetchTMDB(endpoint) {
  try {
    // ===== SỬA: Lấy ngôn ngữ động =====
    const lang = getLang();
    const tmdbLang = lang === "vi" ? "vi-VN" : "en-US";
    
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=${tmdbLang}&page=1`
    );
    const data = await res.json();

    if (!data.results) {
      console.warn("Không có dữ liệu trả về từ TMDB:", endpoint);
      return [];
    }

    return data.results;
  } catch (err) {
    console.error("Lỗi khi fetch TMDB:", err);
    return [];
  }
}

//Load tất cả các grid phim/truyền hình
async function loadMovieGrids() {
  try {
    const [newMovies, trendingSeries, highRated, popularTV] = await Promise.all(
      [
        fetchTMDB("movie/now_playing"), // Phim mới ra rạp
        fetchTMDB("trending/tv/week"), // Series phim xu hướng
        fetchTMDB("movie/top_rated"), // Phim điện ảnh được đánh giá cao
        fetchTMDB("tv/popular"), // Phim bộ đình đám
      ]
    );

    renderGrid("movieGridNew", newMovies, "movie");
    renderGrid("movieGridHot", trendingSeries, "tv");
    renderGrid("movieGridHighRate", highRated, "movie");
    renderGrid("movieGridHotHit", popularTV, "tv");
  } catch (error) {
    console.error("Lỗi khi load grids:", error);
  }
}

// Khi đổi ngôn ngữ → reload lại toàn bộ grid
window.addEventListener("languagechange", () => {
  loadMovieGrids();
});


// Xuất ra cho module khác có thể gọi
export const movieGrid = { renderGrid, createCard, loadMovieGrids };