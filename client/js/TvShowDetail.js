// TvShowDetail.js – Y chang MovieDetail với MyMemory API

import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BG_URL = "https://image.tmdb.org/t/p/original";

// ========== Language & Cache ==========
function currentLang() {
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

async function translateWithCache(text, tvId, targetLang) {
  if (!text || !text.trim()) return "";
  if (targetLang === "en") return text;

  const key = `tv_overview_${tvId}_${targetLang}`;
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

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);

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
    el.placeholder = t(key);
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

function createSeasonHTML(season) {
  const poster = season.poster_path
    ? `${IMG_URL}${season.poster_path}`
    : "https://placehold.co/150x220?text=No+Poster";

  const rating = season.vote_average || null;

  return `
    <div class="season-box">
      <img src="${poster}" alt="${season.name}">
      <div class="season-info">
        <h4>${season.name}</h4>
        ${rating ? `<p class="imdb-badge">IMDb <span>${rating.toFixed(1)}</span></p>` : ""}
        <p><strong>${t("tvshow.airDate")}:</strong> ${season.air_date || t("common.unknown")}</p>
        <p><strong>${t("tvshow.episodes")}:</strong> ${season.episode_count || t("common.unknown")}</p>
        <p><strong>${t("detail.intro")}</strong> ${season.overview || t("common.unknown")}</p>
      </div>
    </div>`;
}

function renderActors(actors) {
  const wrap = document.querySelector("#actors .circle-actor");
  const btn = document.querySelector("#actors .view-more");
  if (!wrap) return;

  wrap.innerHTML = "";
  if (!actors || actors.length === 0) {
    wrap.innerHTML = `<p>${t("tvshow.noActors")}</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  wrap.dataset.allActors = JSON.stringify(actors);
  actors.slice(0, 5).forEach((a) => wrap.insertAdjacentHTML("beforeend", createActorHTML(a)));

  if (btn) {
    const total = actors.length;
    const remain = Math.max(total - 5, 0);

    if (total <= 5) {
      btn.style.display = "none";
      btn.dataset.remain = "0";
    } else {
      btn.style.display = "inline-block";
      btn.dataset.remain = String(remain);
      const base = btn.dataset.i18nBase || t("detail.viewMore");
      btn.textContent = `${base} (${remain}) ▶`;
    }
  }
}

function translateStatus(status) {
  if (!status) return t("common.unknown");
  
  const statusMap = {
    "Returning Series": "tvshow.status.returning",
    "Ended": "tvshow.status.ended",
    "Canceled": "tvshow.status.canceled",
    "In Production": "tvshow.status.inproduction",
    "Planned": "tvshow.status.planned"
  };
  
  return t(statusMap[status]) || status;
}

function renderInfo(tv) {
  const grid = document.querySelector("#info .info-grid");
  if (!grid) return;

  const flag = tv.production_countries?.[0]?.iso_3166_1?.toLowerCase();
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${flag}.png" alt="${
        tv.production_countries?.[0]?.name
      }" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown");

  grid.innerHTML = `
    <h3 data-i18n="tvshow.infoTitle">${t("tvshow.infoTitle")}</h3>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="tvshow.seasons">${t("tvshow.seasons")}</div>
      <div class="movie-info-value">${tv.number_of_seasons || t("common.unknown")}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="tvshow.totalEpisodes">${t("tvshow.totalEpisodes")}</div>
      <div class="movie-info-value">${tv.number_of_episodes || t("common.unknown")}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.country">${t("detail.country")}</div>
      <div class="movie-info-value">${flagHTML}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.status">${t("detail.status")}</div>
      <div class="movie-info-value">${translateStatus(tv.status)}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="tvshow.firstAirDate">${t("tvshow.firstAirDate")}</div>
      <div class="movie-info-value">${tv.first_air_date || t("common.unknown")}</div>
    </div>
  `;
}

function renderSeasons(seasons) {
  const container = document.querySelector("#seasons .season-list");
  const btn = document.getElementById("season-view-more");
  if (!container) return;

  container.innerHTML = "";
  if (!seasons?.length) {
    container.innerHTML = `<p>${t("tvshow.noSeasons")}</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  const valid = seasons.filter((s) => s.season_number > 0);
  if (!valid.length) {
    container.innerHTML = `<p>${t("tvshow.noSeasons")}</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  container.dataset.allSeasons = JSON.stringify(valid);
  valid.slice(0, 3).forEach((s) => container.insertAdjacentHTML("beforeend", createSeasonHTML(s)));

  if (btn) {
    const total = valid.length;
    const remain = Math.max(total - 3, 0);

    if (total <= 3) {
      btn.style.display = "none";
    } else {
      btn.style.display = "inline-block";
      btn.dataset.remain = String(remain);
      const base = btn.dataset.i18nBase || t("detail.viewMore");
      btn.textContent = `${base} (${remain}) ▶`;
    }
  }
}

function renderProducers(companies) {
  const container = document.querySelector("#producers .producer-info");
  if (!container) return;

  container.innerHTML = "";
  if (!companies?.length) {
    container.innerHTML = `<p>${t("tvshow.noProducers")}</p>`;
    return;
  }

  companies.forEach((c) => {
    const logo = c.logo_path ? `${IMG_URL}${c.logo_path}` : null;
    if (logo) {
      container.insertAdjacentHTML("beforeend", 
        `<div class="producer-item"><img src="${logo}" alt="${c.name}" title="${c.name}" /></div>`);
    } else {
      container.insertAdjacentHTML("beforeend", 
        `<div class="producer-item"><p><strong>${c.name}</strong></p></div>`);
    }
  });
}

// ========== API + pages ==========
async function fetchTvDetails(tvId, lang) {
  console.log(`📺 Fetching TV ${tvId} with language: ${lang}`);

  const res = await fetch(
    `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=${tmdbLang(
      lang
    )}&append_to_response=credits,content_ratings`
  );
  const tv = await res.json();

  // Xử lý overview với fallback
  let overview = (tv.overview || "").trim();

  if (lang === "vi") {
    if (!overview || overview.length < 20) {
      console.log(`🔍 TV ${tvId}: VI overview too short, fetching EN...`);
      const enRes = await fetch(
        `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const en = await enRes.json();
      const enOv = (en.overview || "").trim();

      if (enOv && enOv.length > 20) {
        console.log(`📄 Translating EN overview to VI for TV ${tvId}...`);
        overview = await translateWithCache(enOv, tvId, "vi");
        console.log(`✅ Translation complete for TV ${tvId}`);
      }
    } else {
      console.log(`✅ TV ${tvId}: Using VI overview directly`);
    }
  } else {
    if (!overview || overview.length < 20) {
      console.log(`🔍 TV ${tvId}: ${lang} overview missing, using EN...`);
      const enRes = await fetch(
        `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const en = await enRes.json();
      overview = (en.overview || "").trim();
    }
  }

  if (!overview) overview = t("detail.noOverview");

  // Poster
  const poster = tv.poster_path
    ? `${IMG_URL}${tv.poster_path}`
    : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";
  const posterEl = document.querySelector(".movie-content-left img");
  if (posterEl) posterEl.src = poster;

  // Title
  const titleEl = document.querySelector(".movie-content-title h3");
  if (titleEl) titleEl.textContent = tv.name || tv.original_name || t("common.unknown");

  // Overview
  const ovEl = document.querySelector(".movie-content-overview");
  if (ovEl) ovEl.innerHTML = `<span data-i18n="detail.intro">${t("detail.intro")}</span><br>${overview}`;

  // Score
  const scoreEl = document.querySelector(".movie-content-score span");
  if (scoreEl)
    scoreEl.textContent =
      typeof tv.vote_average === "number" ? tv.vote_average.toFixed(1) : "N/A";

  // Age Rating
  const contentRatings = tv.content_ratings?.results || [];
  const rating =
    contentRatings.find((r) => r.iso_3166_1 === "US") ||
    contentRatings.find((r) => r.iso_3166_1 === "GB") ||
    contentRatings[0];
  const ageEl = document.querySelector(".movie-content-age span strong");
  if (ageEl) ageEl.textContent = rating?.rating || "N/A";

  // Genres - with translation for TV shows (TMDB doesn't translate TV genre names)
  const typeEl = document.querySelector(".movie-content-type");
  if (typeEl) {
    const genreMap = {
      "Action & Adventure": "genre.action_adventure",
      "Kids": "genre.kids",
      "News": "genre.news",
      "Reality": "genre.reality",
      "Sci-Fi & Fantasy": "genre.scifi_fantasy",
      "Soap": "genre.soap",
      "Talk": "genre.talk",
      "War & Politics": "genre.war_politics",
      "Animation": "genre.animation",
      "Comedy": "genre.comedy",
      "Crime": "genre.crime",
      "Documentary": "genre.documentary",
      "Drama": "genre.drama",
      "Family": "genre.family",
      "Mystery": "genre.mystery",
      "Western": "genre.western",
      "Action": "genre.action",
      "Adventure": "genre.adventure",
      "Fantasy": "genre.fantasy",
      "History": "genre.history",
      "Horror": "genre.horror",
      "Music": "genre.music",
      "Romance": "genre.romance",
      "Science Fiction": "genre.scifi",
      "Thriller": "genre.thriller",
      "War": "genre.war"
    };
    
    typeEl.innerHTML =
      (tv.genres || [])
        .map((g) => {
          const translationKey = genreMap[g.name];
          const translatedName = translationKey ? t(translationKey) : g.name;
          return `<span>${translatedName}</span>`;
        })
        .join("") || `<span>${t("common.unknown")}</span>`;
  }

  // Creator
  const creator = tv.created_by?.[0]?.name || t("common.unknown");
  const dirEl = document.querySelector(".movie-content-director p");
  if (dirEl)
    dirEl.innerHTML = `<span data-i18n="tvshow.creator">${t("tvshow.creator")}</span> ${creator}`;

  // Background
  const bg = document.querySelector(".background-fade");
  if (bg && tv.backdrop_path) {
    bg.style.backgroundImage = `url(${BG_URL}${tv.backdrop_path})`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }

  // Render sections
  renderActors(tv.credits?.cast || []);
  renderInfo(tv);
  renderSeasons(tv.seasons);
  renderProducers(tv.production_companies);
}

async function loadRecommendedTvShows(tvId, lang) {
  const container = document.getElementById("recommendations");
  if (!container) return;

  container.innerHTML = `<p>${t("common.loading")}</p>`;

  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/recommendations?api_key=${TMDB_API_KEY}&language=${tmdbLang(
        lang
      )}&page=1`
    );
    const data = await res.json();
    const shows = (data.results || []).slice(0, 12);

    container.innerHTML = "";
    if (!shows.length) {
      container.innerHTML = `<p>${t("tvshow.noRecs")}</p>`;
      return;
    }

    const badge = t("badge.tvshow");
    shows.forEach((s) => {
      const poster = s.poster_path
        ? `${IMG_URL}${s.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-card" href="TvShowDetail.html?id=${s.id}">
            <div class="card-info-top"><div class="card-info-ep-top"><span>${badge}</span></div></div>
            <div><img src="${poster}" alt="${s.name || ""}"></div>
          </a>
          <div class="info">
            <h4 class="vietnam-title"><a href="TvShowDetail.html?id=${s.id}">${s.name || ""}</a></h4>
            <h4 class="other-title"><a href="TvShowDetail.html?id=${s.id}">${s.original_name || ""}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (e) {
    console.error("Recommend error:", e);
    container.innerHTML = `<p>${t("tvshow.recError")}</p>`;
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

function initViewMore() {
  const actorGrid = document.querySelector(".actor-grid");
  const seasonGrid = document.querySelector(".season-grid");
  
  // Actors view more
  if (actorGrid && actorGrid.dataset.viewmoreBound !== "1") {
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
        list.innerHTML = "";
        all.forEach((a) => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
        list.classList.add("expanded");
        const collapseText = t("detail.collapse") || "Collapse";
        btn.textContent = `${collapseText} ▲`;
      } else {
        list.innerHTML = "";
        all.slice(0, 5).forEach((a) => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
        list.classList.remove("expanded");
        const remain = Math.max(all.length - 5, 0);
        const base = btn.dataset.i18nBase || t("detail.viewMore");
        btn.textContent = remain > 0 ? `${base} (${remain}) ▶` : `${base} ▶`;
        const section = list.closest(".grid-layout");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Seasons view more
  if (seasonGrid && seasonGrid.dataset.viewmoreBound !== "1") {
    seasonGrid.dataset.viewmoreBound = "1";
    seasonGrid.addEventListener("click", function (e) {
      const btn = e.target.closest("#season-view-more");
      if (!btn) return;

      e.preventDefault();
      const list = document.querySelector("#seasons .season-list");
      if (!list) return;

      const all = JSON.parse(list.dataset.allSeasons || "[]");
      const expanded = list.classList.contains("expanded");

      if (!expanded) {
        list.innerHTML = "";
        all.forEach((s) => list.insertAdjacentHTML("beforeend", createSeasonHTML(s)));
        list.classList.add("expanded");
        const collapseText = t("detail.collapse") || "Collapse";
        btn.textContent = `${collapseText} ▲`;
      } else {
        list.innerHTML = "";
        all.slice(0, 3).forEach((s) => list.insertAdjacentHTML("beforeend", createSeasonHTML(s)));
        list.classList.remove("expanded");
        const remain = Math.max(all.length - 3, 0);
        const base = btn.dataset.i18nBase || t("detail.viewMore");
        btn.textContent = remain > 0 ? `${base} (${remain}) ▶` : `${base} ▶`;
        const section = list.closest(".grid-layout");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
}

// ========== Boot ==========
async function boot() {
  const lang = currentLang();
  console.log(`🌐 Current language: ${lang}`);

  await loadTranslations(lang);
  translateDOM();

  const tvId = new URLSearchParams(window.location.search).get("id") || 2382;

  await fetchTvDetails(tvId, lang);
  await loadRecommendedTvShows(tvId, lang);
  initTabs();
  initViewMore();

  console.log("✅ Page loaded successfully");
}

// ========== Event Listeners ==========
document.addEventListener("DOMContentLoaded", boot);

window.addEventListener("languagechange", async () => {
  console.log("🔄 Language changed, reloading page...");
  await boot();
});

window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    console.log("🔄 Language changed in another tab, reloading...");
    boot();
  }
});