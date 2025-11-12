// MovieDetail.js — i18n thuần JSON + fallback dịch overview khi thiếu VI

import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL  = "https://image.tmdb.org/t/p/w500";
const BG_URL   = "https://image.tmdb.org/t/p/original";

// ---- i18n helpers (JSON only) ----
function currentLang() {
  return document.documentElement.lang || localStorage.getItem('language') || 'vi';
}
function tmdbLang(lang) {
  return lang === 'vi' ? 'vi-VN' : 'en-US';
}
async function loadTranslations(lang) {
  const res = await fetch(`../../../public/locales/${lang}.json`);
  return await res.json();
}

// ---- translate API for overview fallback ----
const LIBRE_TRANSLATE_ENDPOINT = 'https://libretranslate.com/translate';
function getCache(key){try{const raw=localStorage.getItem(key);if(!raw)return null;const {value,exp}=JSON.parse(raw);if(exp&&Date.now()>exp){localStorage.removeItem(key);return null;}return value;}catch{return null;}}
function setCache(key,val,ttl=1000*60*60*24*30){try{localStorage.setItem(key,JSON.stringify({value:val,exp:Date.now()+ttl}))}catch{}}
async function libreTranslate(text, source, target){
  if(!text) return '';
  const r = await fetch(LIBRE_TRANSLATE_ENDPOINT,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ q:text, source, target, format:'text' })
  });
  if(!r.ok) throw new Error(`LibreTranslate ${r.status}`);
  const d = await r.json();
  return d?.translatedText || d?.data?.translatedText || text;
}
async function translateTextWithCache(text, movieId, targetLang){
  const key = `md_overview_${movieId}_${targetLang}`;
  const c = getCache(key); if(c) return c;
  const out = await libreTranslate(text,'en',targetLang);
  setCache(key,out); return out;
}

// ---- UI render helpers ----
function createActorHTML(actor) {
  const img = actor.profile_path
    ? `${IMG_URL}${actor.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&size=300&background=1a1a2e&color=0891b2`;
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

function renderActors(actors, tr) {
  const wrap = document.querySelector("#actors .circle-actor");
  const btn  = document.querySelector("#actors .view-more");
  if (!wrap) return;

  wrap.innerHTML = "";
  if (!actors.length) {
    wrap.innerHTML = `<p>${tr['detail.noActors']}</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  wrap.dataset.allActors = JSON.stringify(actors);
  actors.slice(0,5).forEach(a => wrap.insertAdjacentHTML("beforeend", createActorHTML(a)));

  if (btn) {
    if (actors.length <= 5) btn.style.display = "none";
    else { btn.style.display = "block"; btn.textContent = `${tr['detail.viewMore']} (${actors.length-5}) ⮟`; }
  }
}

function renderInfo(movie, tr) {
  const grid = document.querySelector("#info .info-grid");
  if (!grid) return;

  const mins = movie.runtime ? `${movie.runtime} ${tr['common.minutes']}` : tr['common.unknown'];
  const flag = movie.production_countries?.[0]?.iso_3166_1?.toLowerCase();
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${flag}.png" alt="${movie.production_countries?.[0]?.name}" style="width:32px;height:24px;vertical-align:middle;">`
    : tr['common.unknown'];

  grid.innerHTML = `
    <h3 data-i18n="detail.infoTitle">${tr['detail.infoTitle']}</h3>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.runtime">${tr['detail.runtime']}</div>
      <div class="movie-info-value">${mins}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.country">${tr['detail.country']}</div>
      <div class="movie-info-value">${flagHTML}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.company">${tr['detail.company']}</div>
      <div class="movie-info-value">${movie.production_companies?.[0]?.name || tr['common.unknown']}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.budget">${tr['detail.budget']}</div>
      <div class="movie-info-value">${movie.budget ? movie.budget.toLocaleString() + " $" : tr['common.unknown']}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.revenue">${tr['detail.revenue']}</div>
      <div class="movie-info-value">${movie.revenue ? movie.revenue.toLocaleString() + " $" : tr['common.unknown']}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title" data-i18n="detail.status">${tr['detail.status']}</div>
      <div class="movie-info-value">${movie.status || tr['common.unknown']}</div>
    </div>
  `;
}

// ---- API + pages ----
async function fetchMovieDetails(movieId, lang, tr) {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}&append_to_response=credits`
  );
  const movie = await res.json();

  // Fallback overview: nếu VI thiếu thì lấy EN và dịch sang VI, EN thiếu thì dùng EN gốc
  let overview = (movie.overview || '').trim();
  if (lang === 'vi') {
    if (!overview || overview.length < 8) {
      const enRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`);
      const en = await enRes.json();
      const enOv = (en.overview || '').trim();
      overview = enOv ? await translateTextWithCache(enOv, movieId, 'vi') : '';
    }
  } else {
    if (!overview || overview.length < 8) {
      const enRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`);
      const en = await enRes.json();
      overview = (en.overview || '').trim();
    }
  }
  if (!overview) overview = tr['detail.noOverview'];

  // Poster
  const poster = movie.poster_path
    ? `${IMG_URL}${movie.poster_path}`
    : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";
  const posterEl = document.querySelector(".movie-content-left img");
  if (posterEl) posterEl.src = poster;

  // Title
  const titleEl = document.querySelector(".movie-content-title h3");
  if (titleEl) titleEl.textContent = movie.title || movie.original_title || tr['common.unknown'];

  // Overview
  const ovEl = document.querySelector(".movie-content-overview");
  if (ovEl) ovEl.innerHTML = `<span>${tr['detail.intro']}</span><br>${overview}`;

  // Score
  const scoreEl = document.querySelector(".movie-content-score span");
  if (scoreEl) scoreEl.textContent = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : "N/A";

  // Genres
  const typeEl = document.querySelector(".movie-content-type");
  if (typeEl) {
    typeEl.innerHTML = (movie.genres || []).map(g => `<span>${g.name}</span>`).join("") || `<span>${tr['common.unknown']}</span>`;
  }

  // Director
  const director = movie.credits?.crew?.find(p => p.job === "Director")?.name || tr['common.unknown'];
  const dirEl = document.querySelector(".movie-content-director p");
  if (dirEl) dirEl.innerHTML = `<span data-i18n="detail.director">${tr['detail.director']}</span> ${director}`;

  // Background
  const bg = document.querySelector(".background-fade");
  if (bg) {
    bg.style.backgroundImage = movie.backdrop_path ? `url(${BG_URL}${movie.backdrop_path})` : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  }

  // Cast + Info
  renderActors(movie.credits?.cast || [], tr);
  renderInfo(movie, tr);
}

async function loadRecommendedMovies(movieId, lang, tr) {
  const container = document.getElementById("recommendations");
  if (!container) return;

  container.innerHTML = `<p>${tr['common.loading']}</p>`;

  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}&page=1`
    );
    const data = await res.json();
    const movies = (data.results || []).slice(0, 12);

    container.innerHTML = "";
    if (!movies.length) { container.innerHTML = `<p>${tr['detail.noRecs']}</p>`; return; }

    const badge = tr['badge.movie'];
    movies.forEach((m) => {
      const poster = m.poster_path ? `${IMG_URL}${m.poster_path}` : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-card" href="MovieDetail.html?id=${m.id}">
            <div class="card-info-top"><div class="card-info-ep-top"><span>${badge}</span></div></div>
            <div><img src="${poster}" alt="${m.title || m.original_title || ''}"></div>
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
    container.innerHTML = `<p>${tr['detail.recError']}</p>`;
  }
}

// ---- UI behavior ----
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const target = this.getAttribute("data-tab");
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      this.classList.add("active");
      const c = document.getElementById(target);
      if (c) c.classList.add("active");
    });
  });
}

function initViewMore(btnSel, listSel, tr) {
  const btn = document.querySelector(btnSel);
  const list = document.querySelector(listSel);
  if (!btn || !list) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    const expanded = list.classList.contains("expanded");
    const all = JSON.parse(list.dataset.allActors || "[]");

    if (!expanded) {
      list.innerHTML = "";
      all.forEach(a => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
      list.classList.add("expanded");
      this.textContent = `${tr['detail.collapse']} ⮝`;
    } else {
      list.innerHTML = "";
      all.slice(0,5).forEach(a => list.insertAdjacentHTML("beforeend", createActorHTML(a)));
      const remain = Math.max(all.length - 5, 0);
      this.textContent = remain > 0 ? `${tr['detail.viewMore']} (${remain}) ⮟` : `${tr['detail.viewMore']} ⮟`;
      list.classList.remove("expanded");
      const section = list.closest(".grid-layout");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// ---- boot ----
async function boot() {
  const lang = currentLang();
  const tr = await loadTranslations(lang);

  const movieId = new URLSearchParams(window.location.search).get("id") || 1242404;

  await fetchMovieDetails(movieId, lang, tr);
  await loadRecommendedMovies(movieId, lang, tr);
  initTabs();
  initViewMore("#actors .view-more", "#actors .circle-actor", tr);
}

document.addEventListener("DOMContentLoaded", boot);
window.addEventListener("languagechange", boot);
