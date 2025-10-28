import { TMDB_API_KEY } from "../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const trailerBtn = document.getElementById("trailer-btn");
const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");

// ====== Lấy ID và loại nội dung ====== //
const params = new URLSearchParams(window.location.search);
const contentId = params.get("id");
const type = params.get("type") || "movie"; // "movie" hoặc "tv"

// ====== Hàm lấy trailer ====== //
async function getTrailerKey() {
  try {
    const res = await fetch(`${BASE_URL}/${type}/${contentId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      console.warn("Không có video nào trong TMDB.");
      return null;
    }

    // Ưu tiên trailer chính thức
    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");

    //  Nếu không có, thử teaser
    const teaser = data.results.find(v => v.type === "Teaser" && v.site === "YouTube");

    //  Nếu vẫn không có, lấy clip đầu tiên trên YouTube
    const fallback = data.results.find(v => v.site === "YouTube");

    const best = trailer || teaser || fallback;

    if (!best) {
      console.warn("Không tìm thấy video YouTube hợp lệ.");
      return null;
    }

    console.log(`🎬 Video chọn: ${best.name} [${best.type}]`);
    return best.key;
  } catch (err) {
    console.error("Lỗi lấy trailer:", err);
    return null;
  }
}

// ====== Mở trailer ====== //
trailerBtn.addEventListener("click", async () => {
  const key = await getTrailerKey();
  if (!key) {
    alert("Xin lỗi, không tìm thấy trailer cho nội dung này.");
    return;
  }

  trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
  trailerModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

// ====== Đóng trailer ====== //
function closeModal() {
  trailerModal.style.display = "none";
  trailerFrame.src = ""; // dừng video
  document.body.style.overflow = "";
}

closeTrailer.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === trailerModal) closeModal();
});
