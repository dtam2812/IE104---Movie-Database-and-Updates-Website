// MovieDetail.js – Fixed với MyMemory API + đầy đủ i18n

import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BG_URL = "https://image.tmdb.org/t/p/original";

// ========== Language & Cache ==========
function currentLang() {
  const stored = localStorage.getItem("language");
  const htmlLang = document.documentElement.lang;

  // Đồng bộ nếu không khớp
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

// ========== Translation with MyMemory ==========
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

    // Kiểm tra độ giống nhau
    const similarity = calculateSimilarity(trimmed, translated);
    if (similarity > 0.9) {
      console.warn("Translation too similar, using original");
      return trimmed;
    }

    return translated;
  } catch (err) {
    console.warn("Translation failed:", err.message);
    return trimmed;
  }
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
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

  const key = `md_overview_${movieId}_${targetLang}`;
  const cached = getCache(key);
  if (cached) return cached;

  const translated = await translateText(text, targetLang);
  setCache(key, translated);
  return translated;
}

// ========== i18n helpers ==========
let translations = {};

async function loadTranslations(lang) {
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    if (!res.ok) throw new Error(`Load translations failed: ${res.status}`);
    translations = await res.json();
    return translations;
  } catch (err) {
    console.error("Load translations error:", err);
  }
}

function t(key) {
  return translations[key] || key;
}

// Hàm dịch các phần tử có data-i18n
// --- translateDOM (thay thế)
// Không ghi đè full text cho .view-more. Thay vào đó lưu bản dịch base vào dataset.i18nBase
function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);

    // Nếu là view-more, lưu base text rồi tiếp tục (renderActors sẽ xây full text)
    if (el.classList && el.classList.contains("view-more")) {
      el.dataset.i18nBase = translated;
      return;
    }

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const translated = t(key);
    el.placeholder = translated;
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    el.setAttribute("aria-label", t(key));
  });
}


// ========== UI render helpers ==========
function createActorHTML(actor) {
  const img = actor.profile_path
    ? `${IMG_URL}${actor.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        actor.name
      )}&size=300&background=1a1a2e&color=0891b2`;
  return `
    <div class="cast-box">
      <a class="cast-card" href="CastDetail.html?id=${actor.id}">
        <div class="cast-img"><img src="${img}" alt="${actor.name}" /></div>
      </a>
      <div class="info">
        <h4 class="name"><a href="CastDetail.html?id=${actor.id}">${actor.name}</a></h4>
        <h4 class="other-name"><a href="#">${actor.original_name || ""}</a></h4>
      </div>
    </div>`;
}

// --- renderActors (thay thế)
// Luôn đặt list.dataset.allActors, render 0..4, và set view-more text là "base (remain) ▶"
function renderActors(actors) {
  const wrap = document.querySelector("#actors .circle-actor");
  const btn = document.querySelector("#actors .view-more");
  if (!wrap) return;

  wrap.innerHTML = "";
  if (!actors || actors.length === 0) {
    wrap.innerHTML = `<p>${t("detail.noActors")}</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  // lưu lại toàn bộ danh sách để view-more xài
  wrap.dataset.allActors = JSON.stringify(actors);

  // luôn render preview (first 5)
  actors.slice(0, 5).forEach((a) => wrap.insertAdjacentHTML("beforeend", createActorHTML(a)));

  // prepare view-more button display and text (always show count if >5)
  if (btn) {
    const total = actors.length;
    const remain = Math.max(total - 5, 0);

    if (total <= 5) {
      btn.style.display = "none";
      btn.dataset.remain = "0";
    } else {
      btn.style.display = "inline-block";
      btn.dataset.remain = String(remain);
      // base text ưu tiên dataset.i18nBase (set bởi translateDOM), fallback t()
      const base = btn.dataset.i18nBase || t("detail.viewMore");
      btn.textContent = `${base} (${remain}) ▶`;
    }
  }
}


function translateStatus(status) {
  if (!status) return t("common.unknown");
  
  const statusMap = {
    "Released": "detail.status.released",
    "Post Production": "detail.status.postproduction",
    "In Production": "detail.status.inproduction",
    "Planned": "detail.status.planned",
    "Rumored": "detail.status.rumored",
    "Canceled": "detail.status.canceled"
  };
  
  return t(statusMap[status]) || status;
}

function renderInfo(movie) {
  const grid = document.querySelector("#info .info-grid");
  if (!grid) return;

  const mins = movie.runtime
    ? `${movie.runtime} ${t("common.minutes")}`
    : t("common.unknown");
  const flag = movie.production_countries?.[0]?.iso_3166_1?.toLowerCase();
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${flag}.png" alt="${
        movie.production_countries?.[0]?.name
      }" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown");

  grid.innerHTML = `
    <h3 data-i18n="detail.infoTitle">${t("detail.infoTitle")}</h3>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.runtime">${t("detail.runtime")}</div>
      <div class="movie-info-value">${mins}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.country">${t("detail.country")}</div>
      <div class="movie-info-value">${flagHTML}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.company">${t("detail.company")}</div>
      <div class="movie-info-value">${
        movie.production_companies?.[0]?.name || t("common.unknown")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.budget">${t("detail.budget")}</div>
      <div class="movie-info-value">${
        movie.budget ? movie.budget.toLocaleString() + " $" : t("common.unknown")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.revenue">${t("detail.revenue")}</div>
      <div class="movie-info-value">${
        movie.revenue ? movie.revenue.toLocaleString() + " $" : t("common.unknown")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.status">${t("detail.status")}</div>
      <div class="movie-info-value">${translateStatus(movie.status)}</div>
    </div>
  `;
}

// ========== API + pages ==========
async function fetchMovieDetails(movieId, lang) {
  console.log(`🎬 Fetching movie ${movieId} with language: ${lang}`);

  const res = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${tmdbLang(
      lang
    )}&append_to_response=credits`
  );
  const movie = await res.json();

  // Xử lý overview với fallback
  let overview = (movie.overview || "").trim();

  if (lang === "vi") {
    if (!overview || overview.length < 20) {
      console.log(`📝 Movie ${movieId}: VI overview too short, fetching EN...`);
      const enRes = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const en = await enRes.json();
      const enOv = (en.overview || "").trim();

      if (enOv && enOv.length > 20) {
        console.log(`🔄 Translating EN overview to VI for movie ${movieId}...`);
        overview = await translateWithCache(enOv, movieId, "vi");
        console.log(`✅ Translation complete for movie ${movieId}`);
      }
    } else {
      console.log(`✅ Movie ${movieId}: Using VI overview directly`);
    }
  } else {
    // Ngôn ngữ khác nếu không có thì dùng tiếng Anh
    if (!overview || overview.length < 20) {
      console.log(`📝 Movie ${movieId}: ${lang} overview missing, using EN...`);
      const enRes = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const en = await enRes.json();
      overview = (en.overview || "").trim();
    }
  }

  if (!overview) overview = t("detail.noOverview");

  // Poster
  const poster = movie.poster_path
    ? `${IMG_URL}${movie.poster_path}`
    : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";
  const posterEl = document.querySelector(".movie-content-left img");
  if (posterEl) posterEl.src = poster;

  // Title
  const titleEl = document.querySelector(".movie-content-title h3");
  if (titleEl) titleEl.textContent = movie.title || movie.original_title || t("common.unknown");

  // Overview
  const ovEl = document.querySelector(".movie-content-overview");
  if (ovEl) ovEl.innerHTML = `<span data-i18n="detail.intro">${t("detail.intro")}</span><br>${overview}`;

  // Score
  const scoreEl = document.querySelector(".movie-content-score span");
  if (scoreEl)
    scoreEl.textContent =
      typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A";

  // Genres
  const typeEl = document.querySelector(".movie-content-type");
  if (typeEl) {
    typeEl.innerHTML =
      (movie.genres || []).map((g) => `<span>${g.name}</span>`).join("") ||
      `<span>${t("common.unknown")}</span>`;
  }

  // Director
  const director =
    movie.credits?.crew?.find((p) => p.job === "Director")?.name || t("common.unknown");
  const dirEl = document.querySelector(".movie-content-director p");
  if (dirEl)
    dirEl.innerHTML = `<span data-i18n="detail.director">${t("detail.director")}</span> <span id="director-name">${director}</span>`;

  // Background
  const bg = document.querySelector(".background-fade");
  if (bg) {
    bg.style.backgroundImage = movie.backdrop_path
      ? `url(${BG_URL}${movie.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }

  // Cast + Info
  renderActors(movie.credits?.cast || []);
  renderInfo(movie);
}

async function loadRecommendedMovies(movieId, lang) {
  const container = document.getElementById("recommendations");
  if (!container) return;

  container.innerHTML = `<p>${t("common.loading")}</p>`;

  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=${tmdbLang(
        lang
      )}&page=1`
    );
    const data = await res.json();
    const movies = (data.results || []).slice(0, 12);

    container.innerHTML = "";
    if (!movies.length) {
      container.innerHTML = `<p>${t("detail.noRecs")}</p>`;
      return;
    }

    const badge = t("badge.movie");
    movies.forEach((m) => {
      const poster = m.poster_path
        ? `${IMG_URL}${m.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-card" href="MovieDetail.html?id=${m.id}">
            <div class="card-info-top"><div class="card-info-ep-top"><span>${badge}</span></div></div>
            <div><img src="${poster}" alt="${m.title || m.original_title || ""}"></div>
          </a>
          <div class="info">
            <h4 class="vietnam-title"><a href="MovieDetail.html?id=${m.id}">${m.title || ""}</a></h4>
            <h4 class="other-title"><a href="MovieDetail.html?id=${m.id}">${m.original_title || ""}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (e) {
    console.error("Recommend error:", e);
    container.innerHTML = `<p>${t("detail.recError")}</p>`;
  }
}

// ========== UI behavior ==========
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const target = this.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      const c = document.getElementById(target);
      if (c) c.classList.add("active");
    });
  });
}

// --- initViewMore (thay thế)
// Event delegation gắn 1 lần lên .actor-grid để không mất listener khi DOM bị cập nhật.
// Đảm bảo không bind nhiều lần (dùng data attribute)
function initViewMore() {
  const actorGrid = document.querySelector(".actor-grid");
  if (!actorGrid) return;

  // tránh bind nhiều lần nếu boot() chạy lại
  if (actorGrid.dataset.viewmoreBound === "1") return;
  actorGrid.dataset.viewmoreBound = "1";

  actorGrid.addEventListener("click", function (e) {
    const btn = e.target.closest(".view-more");
    if (!btn) return;

    e.preventDefault();
    const list = document.querySelector("#actors .circle-actor");
    if (!list) return;

    const all = JSON.parse(list.dataset.allActors || "[]");
    const expanded = list.classList.contains("expanded");

    if (!expanded) {
      // show all
      list.innerHTML = "";
      all.forEach((a) => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
      list.classList.add("expanded");

      // update button to "collapse"
      const collapseText = t("detail.collapse") || "Collapse";
      btn.textContent = `${collapseText} ▲`;
      btn.dataset.state = "expanded";
    } else {
      // collapse to first 5
      list.innerHTML = "";
      all.slice(0, 5).forEach((a) => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
      list.classList.remove("expanded");

      const remain = Math.max(all.length - 5, 0);
      const base = btn.dataset.i18nBase || t("detail.viewMore");
      btn.textContent = remain > 0 ? `${base} (${remain}) ▶` : `${base} ▶`;
      btn.dataset.state = "collapsed";

      const section = list.closest(".grid-layout");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}


// ========== Boot ==========
async function boot() {
  const lang = currentLang();
  console.log(`🌍 Current language: ${lang}`);

  await loadTranslations(lang);
  translateDOM(); // Dịch các phần tử HTML có data-i18n

  const movieId = new URLSearchParams(window.location.search).get("id") || 1242404;

  await fetchMovieDetails(movieId, lang);
  await loadRecommendedMovies(movieId, lang);
  initTabs();
  initViewMore();

  console.log("✅ Page loaded successfully");
}

// ========== Event Listeners ==========
document.addEventListener("DOMContentLoaded", boot);

// Lắng nghe thay đổi ngôn ngữ
window.addEventListener("languagechange", async () => {
  console.log("🔄 Language changed, reloading page...");
  await boot();
});

// Lắng nghe storage change (từ tab khác)
window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    console.log("🔄 Language changed in another tab, reloading...");
    boot();
  }
});