import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const trailerBtn = document.getElementById("trailer-btn");
const trailerModal = document.getElementById("trailer-modal");
const trailerContainer = document.getElementById("trailer-container");
const closeTrailer = document.getElementById("close-trailer");

/* Xác định loại nội dung: movie hay tv */
const currentPage = window.location.pathname;
let type = currentPage.includes("TvShowDetail") ? "tv" : "movie";

/* Lấy tham số type và id từ URL */
const params = new URLSearchParams(window.location.search);
const contentId = params.get("id");
const typeParam = params.get("type");
if (typeParam) type = typeParam;

// Lấy trailer key
async function getTrailerKey() {
  try {
    const url = `${BASE_URL}/${type}/${contentId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const data = await (await fetch(url)).json();

    if (!data.results?.length) return null;

    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    const teaser  = data.results.find(v => v.type === "Teaser" && v.site === "YouTube");
    const anyYT   = data.results.find(v => v.site === "YouTube");

    return (trailer || teaser || anyYT)?.key ?? null;
  } catch (err) {
    return null;
  }
}

// Mở trailer
trailerBtn.addEventListener("click", async () => {
  const key = await getTrailerKey();
  if (!key) {
    alert(`Không tìm thấy trailer.`);
    return;
  }

  // Không load iframe trước khi mở modal
  trailerContainer.innerHTML = `
    <iframe
      width="100%"
      height="500"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
      src="https://www.youtube.com/embed/${key}?autoplay=1&enablejsapi=1&widget_referrer="
    ></iframe>
  `;

  trailerModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Xóa history entry nếu có
  history.replaceState(history.state, "", window.location.pathname + window.location.search);
});

// Đóng trailer
function closeModal() {
  trailerModal.style.display = "none";
  trailerContainer.innerHTML = ""; 
  document.body.style.overflow = "";
}

closeTrailer.addEventListener("click", closeModal);
window.addEventListener("click", (e) => { 
  if (e.target === trailerModal) closeModal();
});
