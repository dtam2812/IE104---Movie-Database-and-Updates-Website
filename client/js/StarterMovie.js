// StarterMovie.js - Gộp logic Dịch Tự Động, Trailer và Favorites
import { TMDB_API_KEY } from "../../config.js";
import { favoritesManager } from "../js/Favorite.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = TMDB_API_KEY; // Dùng TMDB_API_KEY làm API_KEY cho consistency
const IMG_W780 = "https://image.tmdb.org/t/p/w780";
const IMG_ORI = "https://image.tmdb.org/t/p/original";
const FALLBACK_POSTER =
  "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Image";

// ========== DOM Elements ==========
const slidesEl = document.getElementById("slides");
const brandEl = document.getElementById("brand"); // Tag <img> logo/title
const enEl = document.getElementById("en");
const metaEl = document.getElementById("meta");
const genresEl = document.getElementById("genres");
const descEl = document.getElementById("desc");
const thumbsEl = document.getElementById("thumbs");

const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");
// SỬA: Ưu tiên lấy playBtn (ID phổ biến trong HTML carousel)
const trailerBtn =
  document.getElementById("playBtn") || document.getElementById("trailer-btn");
const infoBtn = document.querySelector("button[aria-label='Info']");
const favoriteBtn = document.querySelector(".favorite");

let movies = [];
let index = 0;
let timer;

// ========== Language & Cache (Logic Dịch Tự Động) ==========
function getLang() {
  const stored = localStorage.getItem("language");
  const htmlLang = document.documentElement.lang;
  if (stored && stored !== htmlLang) {
    document.documentElement.lang = stored;
    return stored;
  }
  if (htmlLang && htmlLang !== stored) {
    localStorage.setItem("language", htmlLang);
    return htmlLang;
  }
  return stored || htmlLang || "vi";
}

function tmdbLang(lang) {
  return lang === "vi" ? "vi-VN" : "en-US";
}

function formatDuration(runtime, lang) {
  if (!runtime) return "N/A";
  if (lang === "vi") return `${runtime} phút`;
  return `${runtime} min`;
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, exp } = JSON.parse(raw);
    if (exp && Date.now() > exp) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function setCache(key, value, ttlMs = 1000 * 60 * 60 * 24 * 30) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ value, exp: Date.now() + ttlMs })
    );
  } catch {}
}

// Hàm Dịch văn bản qua API MyMemory
async function translateText(text, targetLang) {
  if (!text || !text.trim() || targetLang === "en") return text;
  const trimmed = text.trim();
  if (trimmed.length < 10) return trimmed;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=en|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory API error: ${res.status}`);

    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    if (!translated || translated.length < 10) return trimmed;

    const similarity = calculateSimilarity(trimmed, translated);
    if (similarity > 0.9) {
      console.warn("Translation too similar to original, using original text");
      return trimmed;
    }
    return translated;
  } catch (err) {
    console.warn("Translation failed:", err.message);
    return trimmed;
  }
}

// Hàm tính độ giống nhau (Levenshtein) - Giữ lại để hỗ trợ dịch
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

async function translateWithCache(text, movieId, targetLang) {
  if (!text || !text.trim()) return "";
  if (targetLang === "en") return text;

  const key = `hero_ov_${movieId}_${targetLang}`;
  const cached = getCache(key);
  if (cached) return cached;

  const translated = await translateText(text, targetLang);
  setCache(key, translated);
  return translated;
}
// ========================================================

// ========== DOM Creation ==========
const createEl = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};

const badge = (content, cls) =>
  createEl("div", `badge${cls ? " " + cls : ""}`, content);

// ----- Tạo slide -----
function createSlide(movie, isActive) {
  const wrap = createEl("div", `slide${isActive ? " active" : ""}`);
  const img = createEl("img", "bg");
  img.src = movie.backgroundImage;
  img.alt = movie.title;
  wrap.append(img, createEl("div", "overlay-v"), createEl("div", "overlay-h"));
  return wrap;
}

function renderBackground() {
  if (!slidesEl) return;
  slidesEl.replaceChildren(
    ...movies.map((m, i) => createSlide(m, i === index))
  );
}

// ----- Nội dung slide -----
function renderContent() {
  const m = movies[index];
  if (!m) return;

  // brandEl là thẻ <img> logo/title, gán alt
  if (brandEl) brandEl.alt = m.title;
  if (enEl) enEl.textContent = m.title || ""; // Gán tên tiếng Việt/Tiếng Anh vào enEl

  // Meta
  if (metaEl) {
    metaEl.innerHTML = "";
    const metaData = [
      badge("<b>HD</b>", "grad"),
      badge("<b>PG-13</b>", "white"),
      badge(
        `<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`,
        "outline-yellow"
      ),
      badge(`<span>${m.year}</span>`),
      badge(`<span>${m.duration}</span>`),
    ];
    metaEl.append(...metaData);
  }

  // Genres
  if (genresEl) {
    genresEl.innerHTML = "";
    m.genres
      .slice(0, 4)
      .forEach((g) => genresEl.append(badge(`<span>${g}</span>`)));
    if (m.genres.length > 4)
      genresEl.append(badge(`<span>+${m.genres.length - 4}</span>`));
  }

  // Description
  if (descEl) {
    descEl.classList.remove("expanded");
    descEl.textContent = m.description;

    const oldToggle = descEl.nextElementSibling;
    if (oldToggle && oldToggle.classList.contains("desc-toggle")) {
      oldToggle.remove();
    }

    if (m.description.length > 200) {
      const toggleBtn = document.createElement("span");
      toggleBtn.className = "desc-toggle";
      toggleBtn.textContent = "Xem thêm";

      toggleBtn.onclick = () => {
        const expanded = descEl.classList.toggle("expanded");
        toggleBtn.textContent = expanded ? "Thu gọn" : "Xem thêm";
      };

      descEl.after(toggleBtn);
    }
  }

  // Cập nhật trạng thái nút yêu thích
  updateFavoriteButtonState();
}

// ----- Thumbnails -----
function renderThumbs() {
  if (!thumbsEl) return;
  thumbsEl.replaceChildren(
    ...movies.map((m, i) => {
      const b = createEl("button", `thumb${i === index ? " active" : ""}`);
      b.ariaLabel = m.title;
      const img = createEl("img");
      img.src = m.thumbnailImage;
      img.alt = m.title;
      b.append(img);
      b.onclick = () => {
        index = i;
        update(true);
      };
      return b;
    })
  );
}

// ----- Cập nhật carousel -----
function update(stopAuto = false) {
  renderBackground();
  renderContent();
  renderThumbs();

  if (stopAuto) {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
}

function next() {
  index = (index + 1) % movies.length;
  update();
}

// ========== Trailer Logic ==========
async function getTrailerKey(movieId, type = "movie") {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${movieId}/videos?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const trailer = data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );
    const teaser = data.results.find(
      (v) => v.type === "Teaser" && v.site === "YouTube"
    );
    const fallback = data.results.find((v) => v.site === "YouTube");

    return (trailer || teaser || fallback)?.key || null;
  } catch (err) {
    console.error("Lỗi lấy trailer:", err);
    return null;
  }
}
// ===================================

// ========== Logic Yêu thích ==========
async function updateFavoriteButtonState() {
  const currentMovie = movies[index];
  if (!currentMovie || !favoriteBtn) return;

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  if (!token) {
    resetFavoriteButton();
    return;
  }

  try {
    // Kiểm tra trạng thái yêu thích từ server
    const isFavorite = await favoritesManager.checkFavoriteStatus(
      currentMovie.id
    );

    // Cập nhật giao diện dựa trên kết quả
    if (isFavorite) {
      favoriteBtn.classList.add("active");
      const path = favoriteBtn.querySelector("path");
      if (path) path.style.fill = "#ff4444";
    } else {
      resetFavoriteButton();
    }
  } catch (error) {
    console.error("Error checking favorite status:", error);
    resetFavoriteButton();
  }
}

// ----- Đặt lại nút yêu thích về trạng thái mặc định -----
function resetFavoriteButton() {
  favoriteBtn.classList.remove("active");
  const path = favoriteBtn.querySelector("path");
  if (path) path.style.fill = "#fff";
}

// ----- Xử lý sự kiện click nút yêu thích -----
async function handleFavoriteClick() {
  const currentMovie = movies[index];
  if (!currentMovie) return;

  // Khởi tạo favoritesManager nếu chưa được khởi tạo
  if (!favoritesManager.isInitialized) {
    favoritesManager.init();
  }

  // Tạo film data để gửi lên server
  const filmData = {
    id: currentMovie.id.toString(),
    type: "Movie",
    title: currentMovie.title,
    originalName: currentMovie.englishTitle,
    posterPath: currentMovie.thumbnailImage,
  };

  // Gọi phương thức xử lý yêu thích
  await favoritesManager.handleFavoriteClick(favoriteBtn, filmData);
}
// ===================================

// ========== Data Fetching (Có Dịch) ==========
async function fetchMovies() {
  try {
    const lang = getLang();
    console.log("🌐 Fetching movies with language:", lang);

    const url = `${TMDB_BASE}/trending/movie/week?api_key=${API_KEY}&language=${tmdbLang(
      lang
    )}&page=1`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);

    const { results } = await res.json();
    const basicMovies = results?.slice(0, 6) || [];

    if (!basicMovies.length) {
      console.warn("No movies returned from TMDB");
      return;
    }

    const movieDetails = await Promise.all(
      basicMovies.map(async (m) => {
        try {
          // Lấy chi tiết theo ngôn ngữ hiện tại
          const detailRes = await fetch(
            `${TMDB_BASE}/movie/${m.id}?api_key=${API_KEY}&language=${tmdbLang(
              lang
            )}`
          );
          if (!detailRes.ok)
            throw new Error(`Detail fetch failed: ${detailRes.status}`);

          const detail = await detailRes.json();

          // Xử lý overview (LOGIC DỊCH)
          let overview = (detail.overview || "").trim();
          let title = (
            detail.title ||
            detail.original_title ||
            "Unknown"
          ).trim();

          if (lang === "vi") {
            // Nếu VI overview quá ngắn hoặc rỗng, lấy EN và dịch
            if (!overview || overview.length < 20) {
              const enRes = await fetch(
                `${TMDB_BASE}/movie/${m.id}?api_key=${API_KEY}&language=en-US`
              );
              if (enRes.ok) {
                const enDetail = await enRes.json();
                const enOverview = (enDetail.overview || "").trim();

                if (enOverview && enOverview.length > 20) {
                  overview = await translateWithCache(enOverview, m.id, "vi");
                }
              }
            }
          }
          if (!overview)
            overview =
              lang === "vi" ? "Không có mô tả." : "No overview available.";

          return {
            id: m.id, // BẮT BUỘC CHO TRAILER VÀ FAVORITE
            title: title,
            englishTitle: detail.original_title || title,
            backgroundImage: detail.backdrop_path
              ? `${IMG_ORI}${detail.backdrop_path}`
              : "https://placehold.co/1920x1080/1a1a2e/0891b2?text=No+Image",
            thumbnailImage: detail.poster_path
              ? `${IMG_W780}${detail.poster_path}`
              : FALLBACK_POSTER,
            imdbRating: (detail.vote_average || 0).toFixed(1),
            year: detail.release_date?.split("-")[0] || "N/A",
            duration: detail.runtime
              ? formatDuration(detail.runtime, lang)
              : lang === "vi"
              ? "N/A"
              : "N/A",
            genres: detail.genres?.map((g) => g.name) || [],
            description: overview,
          };
        } catch (err) {
          console.warn(`⚠️ Error fetching movie ${m.id}:`, err);
          return null;
        }
      })
    );

    movies = movieDetails.filter(Boolean);

    if (movies.length > 0) {
      console.log(`✅ Loaded ${movies.length} movies successfully`);
      update();
      clearInterval(timer);
      timer = setInterval(next, 5000);
    } else {
      console.warn("No valid movies to display");
    }
  } catch (err) {
    console.error("❌ Fetch TMDB failed:", err);
  }
}

// ========== Event Listeners (Gộp) ==========

// ----- Trailer Button Event -----
if (trailerBtn) {
  trailerBtn.addEventListener("click", async () => {
    const currentMovie = movies[index];
    if (!currentMovie) return;

    const key = await getTrailerKey(currentMovie.id);
    if (!key) {
      alert("Xin lỗi, không tìm thấy trailer cho phim này.");
      return;
    }

    trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
    trailerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
}

function closeModal() {
  trailerModal.style.display = "none";
  trailerFrame.src = "";
  document.body.style.overflow = "";
}

if (closeTrailer) {
  closeTrailer.addEventListener("click", closeModal);
}

if (trailerModal) {
  window.addEventListener("click", (e) => {
    if (e.target === trailerModal) closeModal();
  });
}

// ----- Favorite Button Event -----
if (favoriteBtn) {
  favoriteBtn.addEventListener("click", handleFavoriteClick);
}

// ----- Info Button -----
infoBtn.addEventListener("click", () => {
  const currentMovie = movies[index];
  if (!currentMovie) return;
  window.location.href = `../pages/MovieDetail.html?id=${currentMovie.id}`;
});

// Listen for language change (giữ nguyên)
window.addEventListener("languagechange", async () => {
  console.log("🔄 Language changed, reloading movies...");
  clearInterval(timer);
  movies = [];
  index = 0;
  await fetchMovies();
});

// Listen for storage change (giữ nguyên)
window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    console.log("🔄 Language changed in another tab, reloading...");
    clearInterval(timer);
    movies = [];
    index = 0;
    fetchMovies();
  }
});

// ========== Khởi tạo ==========
document.addEventListener("DOMContentLoaded", () => {
  // Khởi tạo favoritesManager
  if (favoritesManager && typeof favoritesManager.init === "function") {
    favoritesManager.init();
  }

  fetchMovies();
});

export const starterMovie = { update, fetchMovies };
