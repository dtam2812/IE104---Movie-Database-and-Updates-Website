import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const trailerBtn = document.getElementById("trailer-btn");
const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");

// Xác định loại nội dung (movie hoặc tv)   
const currentPage = window.location.pathname;
let type = "movie"; // mặc định

// Dựa vào tên file HTML để xác định type
if (currentPage.includes("TvShowDetail")) {
  type = "tv";
} else if (currentPage.includes("MovieDetail")) {
  type = "movie";
}

// Lấy params từ URL
const params = new URLSearchParams(window.location.search);
const contentId = params.get("id");

// Cho phép override type bằng query param
const typeParam = params.get("type");
if (typeParam && (typeParam === "movie" || typeParam === "tv")) {
  type = typeParam;
}

// Lấy key trailer từ TMDB
async function getTrailerKey() {
  try {
    const url = `${BASE_URL}/${type}/${contentId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Ưu tiên 1: Trailer chính thức
    const trailer = data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    // Ưu tiên 2: Teaser
    const teaser = data.results.find(
      (v) => v.type === "Teaser" && v.site === "YouTube"
    );

    // Ưu tiên 3: Bất kỳ video YouTube nào
    const fallback = data.results.find((v) => v.site === "YouTube");

    const best = trailer || teaser || fallback;

    return best ? best.key : null;
  } catch (err) {
    console.error("Lỗi lấy trailer:", err);
    return null;
  }
}

// Mở trailer
trailerBtn.addEventListener("click", async () => {
  const key = await getTrailerKey();

  if (!key) {
    alert(
      `Xin lỗi, không tìm thấy trailer cho ${
        type === "tv" ? "TV Show" : "phim"
      } này.`
    );
    return;
  }

  trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
  trailerModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

// Đóng trailer
function closeModal() {
  trailerModal.style.display = "none";
  trailerFrame.src = "";
  document.body.style.overflow = "";
}

closeTrailer.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
  if (e.target === trailerModal) closeModal();
});