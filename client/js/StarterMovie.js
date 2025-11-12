// StarterMovie.js — phiên bản an toàn, không để lỗi dịch chặn render
// Giả định trang HomePage.html gọi: import { load } from "../../js/StarterMovie.js"; await load();

import { TMDB_API_KEY } from "../../config.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W780  = "https://image.tmdb.org/t/p/w780";
const IMG_ORI   = "https://image.tmdb.org/t/p/original";

const LIBRE_TRANSLATE = "https://libretranslate.com/translate";

// ========== utils ==========
const tmdbLang = (lang) => (lang === "vi" ? "vi-VN" : "en-US");

function getLang() {
  return document.documentElement.lang || localStorage.getItem("language") || "vi";
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

// ========== translate helpers ==========
async function libreTranslate(text, source, target) {
  // Chặn gọi vớ vẩn dẫn tới 400
  if (!text || !text.trim()) return "";
  if (!source || !target) return text;

  const res = await fetch(LIBRE_TRANSLATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source, target, format: "text" }),
  });

  // Không throw ra ngoài. 400/429/5xx thì trả lại EN để UI vẫn chạy.
  if (!res.ok) {
    console.warn("LibreTranslate failed:", res.status, await safeText(res));
    return text;
  }
  const data = await res.json().catch(() => ({}));
  return data?.translatedText || data?.data?.translatedText || text;
}

async function safeText(r) {
  try { return await r.text(); } catch { return ""; }
}

async function translateTextWithCache(text, movieId, targetLang) {
  if (!text || !text.trim()) return "";
  const key = `home_overview_${movieId}_${targetLang}`;
  const c = getCache(key);
  if (c) return c;

  const out =
    targetLang === "vi"
      ? await libreTranslate(text, "en", "vi")
      : text; // các ngôn ngữ khác: để nguyên EN

  setCache(key, out);
  return out;
}

// ========== TMDB fetching ==========
async function fetchTrendingMovie(lang) {
  // Bạn có thể đổi endpoint theo thiết kế của bạn
  const url = `${TMDB_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB trending -> ${res.status}`);
  const data = await res.json();
  return (data.results || [])[0] || null;
}

async function fetchMovieById(id, lang) {
  const url = `${TMDB_BASE}/movie/${id}?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB movie ${id} -> ${res.status}`);
  return await res.json();
}

// ========== model builder ==========
async function buildMovieModel(lang) {
  // Chọn movie hiển thị trên hero
  const featured = await fetchTrendingMovie(lang);
  if (!featured) {
    return {
      id: 0,
      title: "N/A",
      overview: "",
      poster: "",
      backdrop: "",
      vote: "N/A",
    };
  }

  const id = featured.id;
  // Lấy chi tiết để chắc overview đúng
  const detail = await fetchMovieById(id, lang);

  // Lấy EN để fallback/đem đi dịch khi cần
  let enOverview = detail.overview || "";
  if (!enOverview || enOverview.trim().length < 8) {
    const en = await fetchMovieById(id, "en");
    enOverview = en.overview || "";
  }

  let finalOverview = detail.overview || "";
  if (getLang() === "vi") {
    // Chỉ dịch khi EN có nội dung đủ dài
    if (!finalOverview || finalOverview.trim().length < 8) {
      finalOverview = await translateTextWithCache(enOverview, id, "vi");
    }
  } else {
    // Ngôn ngữ khác: nếu thiếu thì dùng EN gốc
    if (!finalOverview || finalOverview.trim().length < 8) {
      finalOverview = enOverview;
    }
  }

  return {
    id,
    title: detail.title || detail.original_title || "N/A",
    overview: finalOverview || "",
    poster: detail.poster_path ? `${IMG_W780}${detail.poster_path}` : "",
    backdrop: detail.backdrop_path ? `${IMG_ORI}${detail.backdrop_path}` : "",
    vote: typeof detail.vote_average === "number" ? detail.vote_average.toFixed(1) : "N/A",
  };
}

// ========== render ==========
function renderHero(model) {
  // Điều chỉnh selector theo HTML của bạn
  const hero = document.querySelector(".starter-hero") || document.body;

  const bg = document.querySelector(".background-fade");
  if (bg && model.backdrop) {
    bg.style.backgroundImage = `url(${model.backdrop})`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }

  const titleEl = document.querySelector(".starter-title, .movie-content-title h3");
  if (titleEl) titleEl.textContent = model.title;

  const overviewEl = document.querySelector(".starter-overview, .movie-content-overview");
  if (overviewEl) {
    overviewEl.innerHTML = `
      <span data-i18n="detail.intro">Giới thiệu:</span><br>
      ${model.overview || "Không có mô tả."}
    `;
  }

  const scoreEl = document.querySelector(".starter-score span, .movie-content-score span");
  if (scoreEl) scoreEl.textContent = model.vote;

  const posterEl = document.querySelector(".starter-poster img, .movie-content-left img");
  if (posterEl && model.poster) posterEl.src = model.poster;

  // Nút trailer nếu có
  const trailerBtn = document.getElementById("trailer-btn");
  if (trailerBtn) {
    trailerBtn.href = `MovieDetail.html?id=${model.id}#trailer`;
  }
}

// ========== public API ==========
export async function load() {
  try {
    const lang = getLang();
    const model = await buildMovieModel(lang);
    renderHero(model);
  } catch (err) {
    console.error("StarterMovie.load error:", err);
    // Thông báo nhẹ nhưng không crash UI
    const holder = document.querySelector(".starter-overview, .movie-content-overview");
    if (holder) holder.textContent = "Không thể tải dữ liệu.";
  }
}