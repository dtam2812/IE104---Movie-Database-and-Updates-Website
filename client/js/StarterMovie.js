// StarterMovie.js - Fixed with better translation

import { TMDB_API_KEY } from "../../config.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W780 = "https://image.tmdb.org/t/p/w780";
const IMG_ORI = "https://image.tmdb.org/t/p/original";

// ========== DOM Elements ==========
const slidesEl = document.getElementById("slides");
const enEl = document.getElementById("en");
const metaEl = document.getElementById("meta");
const genresEl = document.getElementById("genres");
const descEl = document.getElementById("desc");
const thumbsEl = document.getElementById("thumbs");

const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");
const trailerBtn = document.getElementById("trailer-btn");
const infoBtn = document.querySelector("button[aria-label='Info']");

let movies = [];
let index = 0;
let timer;

// ========== Language & Cache ==========
function getLang() {
  // Ưu tiên: localStorage > document.documentElement.lang > default
  const stored = localStorage.getItem("language");
  const htmlLang = document.documentElement.lang;
  
  // Sync nếu không khớp
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

// format runtime theo ngôn ngữ
function formatDuration(runtime, lang) {
  if (!runtime) return "N/A";
  // runtime là số phút (number)
  if (lang === "vi") return `${runtime} phút`;
  // tiếng Anh ngắn gọn: "120 min"
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
    localStorage.setItem(key, JSON.stringify({ value, exp: Date.now() + ttlMs }));
  } catch {}
}

// ========== Translation API (MyMemory - better than LibreTranslate) ==========
async function translateText(text, targetLang) {
  if (!text || !text.trim() || targetLang === "en") return text;
  
  const trimmed = text.trim();
  if (trimmed.length < 10) return trimmed; // Quá ngắn, không cần dịch
  
  try {
    // MyMemory Translation API (free, no key needed)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=en|${targetLang}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory API error: ${res.status}`);
    
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    
    // Validation: kiểm tra kết quả dịch có hợp lệ không
    if (!translated || translated.length < 10) return trimmed;
    
    // Kiểm tra xem có phải lỗi không (MyMemory trả về text gốc nếu không dịch được)
    const similarity = calculateSimilarity(trimmed, translated);
    if (similarity > 0.9) {
      console.warn("Translation too similar to original, using original text");
      return trimmed;
    }
    
    return translated;
  } catch (err) {
    console.warn("Translation failed:", err.message);
    return trimmed; // Fallback: giữ nguyên text gốc
  }
}

// Hàm tính độ giống nhau giữa 2 chuỗi (0-1)
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

// ========== DOM Creation ==========
const createEl = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};

const badge = (content, cls) =>
  createEl("div", `badge${cls ? " " + cls : ""}`, content);

// ========== Render Functions ==========
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
  slidesEl.replaceChildren(...movies.map((m, i) => createSlide(m, i === index)));
}

// ----- Nội dung slide -----
function renderContent() {
  const m = movies[index];
  if (!m) return;
  
  if (enEl) enEl.textContent = m.title || "";

  if (metaEl) {
    metaEl.innerHTML = "";
    const metaData = [
      badge("<b>HD</b>", "grad"),
      badge("<b>PG-13</b>", "white"),
      badge(`<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`, "outline-yellow"),
      badge(`<span>${m.year}</span>`),
      badge(`<span>${m.duration}</span>`),
    ];
    metaEl.append(...metaData);
  }

  if (genresEl) {
    genresEl.innerHTML = "";
    m.genres.slice(0, 4).forEach((g) => genresEl.append(badge(`<span>${g}</span>`)));
    if (m.genres.length > 4)
      genresEl.append(badge(`<span>+${m.genres.length - 4}</span>`));
  }

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

// ========== Data Fetching ==========
async function fetchMovies() {
  try {
    const lang = getLang();
    console.log("🌐 Fetching movies with language:", lang);
    
    const url = `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}&page=1`;
    
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
            `${TMDB_BASE}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}`
          );
          if (!detailRes.ok) throw new Error(`Detail fetch failed: ${detailRes.status}`);
          
          const detail = await detailRes.json();

          // Xử lý overview
          let overview = (detail.overview || "").trim();
          
          if (lang === "vi") {
            // Nếu tiếng Việt không có hoặc quá ngắn
            if (!overview || overview.length < 20) {
              console.log(`📝 Movie ${m.id}: VI overview too short, fetching EN...`);
              
              // Lấy bản tiếng Anh
              const enRes = await fetch(
                `${TMDB_BASE}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=en-US`
              );
              if (enRes.ok) {
                const enDetail = await enRes.json();
                const enOverview = (enDetail.overview || "").trim();
                
                if (enOverview && enOverview.length > 20) {
                  console.log(`🔄 Translating EN overview to VI for movie ${m.id}...`);
                  overview = await translateWithCache(enOverview, m.id, "vi");
                  console.log(`✅ Translation complete for movie ${m.id}`);
                }
              }
            } else {
              console.log(`✅ Movie ${m.id}: Using VI overview directly`);
            }
          } else {
            // Nếu ngôn ngữ khác mà không có overview, dùng tiếng Anh
            if (!overview || overview.length < 20) {
              console.log(`📝 Movie ${m.id}: ${lang} overview missing, using EN...`);
              const enRes = await fetch(
                `${TMDB_BASE}/movie/${m.id}?api_key=${TMDB_API_KEY}&language=en-US`
              );
              if (enRes.ok) {
                const enDetail = await enRes.json();
                overview = (enDetail.overview || "").trim();
              }
            }
          }

          if (!overview) overview = lang === "vi" ? "Không có mô tả." : "No overview available.";

          return {
            title: detail.title || detail.original_title || "Unknown",
            backgroundImage: detail.backdrop_path
              ? `${IMG_ORI}${detail.backdrop_path}`
              : "https://placehold.co/1920x1080/1a1a2e/0891b2?text=No+Image",
            thumbnailImage: detail.poster_path
              ? `${IMG_W780}${detail.poster_path}`
              : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Image",
            imdbRating: (detail.vote_average || 0).toFixed(1),
            year: detail.release_date?.split("-")[0] || "N/A",
            duration: detail.runtime ? formatDuration(detail.runtime, lang) : (lang === "vi" ? "N/A" : "N/A"),
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

// ========== Event Listeners ==========
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite");
  if (!btn) return;
  btn.classList.toggle("active");
});

// Listen for language change
window.addEventListener("languagechange", async () => {
  console.log("🔄 Language changed, reloading movies...");
  clearInterval(timer);
  movies = [];
  index = 0;
  await fetchMovies();
});

// Listen for storage change (from other tabs)
window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    console.log("🔄 Language changed in another tab, reloading...");
    clearInterval(timer);
    movies = [];
    index = 0;
    fetchMovies();
  }
});

// ========== Start ==========
// Đảm bảo khởi tạo sau khi DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fetchMovies);
} else {
  fetchMovies();
}

export const starterMovie = { update, fetchMovies };