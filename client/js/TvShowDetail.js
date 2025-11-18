import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BG_URL = "https://image.tmdb.org/t/p/original";

let translations = {};

// ==================== HỆ THỐNG DỊCH ====================
async function loadTranslations(lang) {
  try {
    const res = await fetch(`../../../public/locales/${lang}.json`);
    translations = await res.json();
  } catch (err) {
    console.error("Load translations error:", err);
  }
}

function t(key) {
  return translations[key] || key;
}

function currentLang() {
  return (
    localStorage.getItem("language") || document.documentElement.lang || "vi"
  );
}

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

// MyMemory + cache 30 ngày
async function translateText(text, target = "vi") {
  if (!text || target === "en") return text;
  const key = `trans_${btoa(
    unescape(encodeURIComponent(text.substring(0, 100)))
  )}_${target}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|${target}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data.responseData.translatedText || text;
    localStorage.setItem(key, translated);
    return translated;
  } catch {
    return text;
  }
}

// ==================== MAIN FETCH ====================
async function fetchTvDetails(tvId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";

  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=${apiLang}&append_to_response=credits,content_ratings`
    );
    const tv = await res.json();

    // === TITLE (dịch nếu TMDB không có bản Việt) ===
    let displayName = tv.name || tv.original_name;
    if (lang === "vi" && tv.name === tv.original_name) {
      displayName = await translateText(tv.original_name, "vi");
    }

    // === OVERVIEW (fallback + dịch) ===
    let overview = tv.overview || "";
    if (lang === "vi" && (!overview || overview.length < 20)) {
      const enRes = await fetch(
        `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const enTv = await enRes.json();
      overview = await translateText(enTv.overview || "", "vi");
    }
    if (!overview) overview = t("detail.noOverview") || "Không có mô tả";

    // Poster
    document.querySelector(".detail__poster img").src = tv.poster_path
      ? `${IMG_URL}${tv.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // Title
    document.querySelector(".detail__title h3").textContent = displayName;

    // Overview
    document.querySelector(".detail__overview").innerHTML = `
      <span>${t("detail.intro") || "Giới thiệu"}:</span><br>${overview}
    `;

    // Score
    document.querySelector(".detail__score span").textContent =
      tv.vote_average?.toFixed(1) || "N/A";

    // Age rating
    const ratings = tv.content_ratings?.results || [];
    const rating =
      ratings.find((r) => r.iso_3166_1 === "US") ||
      ratings.find((r) => r.iso_3166_1 === "GB") ||
      ratings[0];
    const ageEl = document.querySelector(".detail__age span strong");
    if (ageEl) ageEl.textContent = rating?.rating || "N/A";

    // Genres (TMDB không dịch genre TV → dịch thủ công)
    const genreMap = {
      "Action & Adventure": "genre.action_adventure",
      "Sci-Fi & Fantasy": "genre.scifi_fantasy",
      "War & Politics": "genre.war_politics",
      Animation: "genre.animation",
      Comedy: "genre.comedy",
      Crime: "genre.crime",
      Documentary: "genre.documentary",
      Drama: "genre.drama",
      Family: "genre.family",
      Kids: "genre.kids",
      Mystery: "genre.mystery",
      News: "genre.news",
      Reality: "genre.reality",
      Soap: "genre.soap",
      Talk: "genre.talk",
      Western: "genre.western",
    };
    document.querySelector(".detail__genres").innerHTML =
      tv.genres
        ?.map((g) => {
          const key = genreMap[g.name] || null;
          return `<span>${key ? t(key) : g.name}</span>`;
        })
        .join("") || `<span>${t("common.unknown")}</span>`;

    // Creator
    const creator = tv.created_by?.[0]?.name || t("common.unknown");
    document.querySelector(".detail__director p").innerHTML = `
      <span>${t("tvshow.creator") || "Nhà sản xuất"}:</span> ${creator}
    `;

    // Background
    const bg = document.querySelector(".detail__background");
    if (bg && tv.backdrop_path) {
      bg.style.backgroundImage = `url(${BG_URL}${tv.backdrop_path})`;
      bg.style.backgroundSize = "cover";
      bg.style.backgroundPosition = "center";
    }

    // Render các phần khác
    renderActors(tv.credits?.cast || []);
    renderInfo(tv);
    renderSeasons(tv.seasons || []);
    renderProducers(tv.production_companies || []);
  } catch (err) {
    console.error("Lỗi tải TV Show:", err);
  }
}

// ==================== RENDER FUNCTIONS (giữ nguyên class của file 1) ====================
function createActorHTML(actor) {
  const img = actor.profile_path
    ? `${IMG_URL}${actor.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        actor.name
      )}&size=300&background=1a1a2e&color=0891b2`;
  return `
    <div class="cast-box actor">
      <a class="cast-card actor__link" href="CastDetail.html?id=${actor.id}">
        <div class="cast-img"><img class="actor__img" src="${img}" alt="${
    actor.name
  }" /></div>
      </a>
      <div class="info">
        <h4 class="name actor__name"><a href="CastDetail.html?id=${actor.id}">${
    actor.name
  }</a></h4>
        <h4 class="other-name"><a href="#">${actor.original_name || ""}</a></h4>
      </div>
    </div>`;
}

function renderActors(actors) {
  const container = document.querySelector("#actors .actors");
  const btn = document.querySelector("#actors .tab-panel__more");
  if (!container) return;
  container.innerHTML = "";
  if (!actors.length) {
    container.innerHTML = `<p>${
      t("detail.noActors") || "Không có thông tin diễn viên."
    }</p>`;
    if (btn) btn.style.display = "none";
    return;
  }
  container.dataset.all = JSON.stringify(actors);
  actors
    .slice(0, 5)
    .forEach((a) =>
      container.insertAdjacentHTML("beforeend", createActorHTML(a))
    );
  if (btn) {
    const remain = actors.length - 5;
    btn.style.display = remain <= 0 ? "none" : "block";
    btn.textContent =
      remain > 0
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain})`
        : t("detail.viewMore") || "Xem thêm";
  }
}

function renderInfo(tv) {
  const grid = document.querySelector("#info .tab-panel--info");
  if (!grid) return;
  const flag = tv.production_countries?.[0]?.iso_3166_1?.toLowerCase() || null;
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${flag}.png" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown");
  grid.innerHTML = `
    <h3 class="tab-panel__title">${
      t("tvshow.infoTitle") || "Thông tin phim"
    }</h3>
    <div class="info-item"><div class="info-item__label">${
      t("tvshow.seasons") || "Số mùa"
    }:</div><div class="info-item__value">${
    tv.number_of_seasons || "N/A"
  }</div></div>
    <div class="info-item"><div class="info-item__label">${
      t("tvshow.totalEpisodes") || "Tổng số tập"
    }:</div><div class="info-item__value">${
    tv.number_of_episodes || "N/A"
  }</div></div>
    <div class="info-item"><div class="info-item__label">${
      t("detail.country") || "Quốc gia"
    }:</div><div class="info-item__value">${flagHTML}</div></div>
    <div class="info-item"><div class="info-item__label">${
      t("detail.status") || "Trạng thái"
    }:</div><div class="info-item__value">${
    tv.status || t("common.unknown")
  }</div></div>
    <div class="info-item"><div class="info-item__label">${
      t("tvshow.firstAirDate") || "Ngày ra mắt"
    }:</div><div class="info-item__value">${
    tv.first_air_date || t("common.unknown")
  }</div></div>
  `;
}

function createSeasonHTML(season) {
  const poster = season.poster_path
    ? `${IMG_URL}${season.poster_path}`
    : "https://placehold.co/150x220?text=No+Poster";
  const rating = season.vote_average;
  return `
    <div class="season">
      <img class="season__poster" src="${poster}" alt="${season.name}">
      <div class="season__info">
        <h4 class="season__name">${season.name}</h4>
        ${
          rating
            ? `<p class="season__badge">IMDb <span>${rating.toFixed(
                1
              )}</span></p>`
            : ""
        }
        <p><strong>${t("tvshow.airDate") || "Ngày phát sóng"}:</strong> ${
    season.air_date || "N/A"
  }</p>
        <p><strong>${t("tvshow.episodes") || "Số tập"}:</strong> ${
    season.episode_count || "N/A"
  }</p>
        <p><strong>${t("detail.intro") || "Giới thiệu"}:</strong> ${
    season.overview || "N/A"
  }</p>
      </div>
    </div>`;
}

function renderSeasons(seasons) {
  const container = document.querySelector("#seasons .seasons");
  const btn = document.getElementById("season-view-more");
  if (!container) return;
  container.innerHTML = "";
  const valid = seasons.filter((s) => s.season_number > 0);
  if (!valid.length) {
    container.innerHTML = `<p>${
      t("tvshow.noSeasons") || "Không có thông tin mùa phim."
    }</p>`;
    if (btn) btn.style.display = "none";
    return;
  }
  container.dataset.all = JSON.stringify(valid);
  valid
    .slice(0, 3)
    .forEach((s) =>
      container.insertAdjacentHTML("beforeend", createSeasonHTML(s))
    );
  if (btn) {
    const remain = valid.length - 3;
    btn.style.display = remain <= 0 ? "none" : "block";
    btn.textContent =
      remain > 0
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain})`
        : t("detail.viewMore") || "Xem thêm";
  }
}

function renderProducers(companies) {
  const container = document.querySelector("#producers .producers");
  if (!container) return;
  container.innerHTML = "";
  if (!companies?.length) {
    container.innerHTML = `<p>${
      t("tvshow.noProducers") || "Không có thông tin nhà sản xuất."
    }</p>`;
    return;
  }
  companies.forEach((c) => {
    const logo = c.logo_path ? `${IMG_URL}${c.logo_path}` : null;
    const html = logo
      ? `<div class="producer"><img class="producer__logo" src="${logo}" alt="${c.name}" title="${c.name}"></div>`
      : `<div class="producer"><p class="producer__name"><strong>${c.name}</strong></p></div>`;
    container.insertAdjacentHTML("beforeend", html);
  });
}

async function loadRecommendedTvShows(tvId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";
  const container = document.getElementById("recommendations");
  if (!container) return;
  container.innerHTML = `<p>${t("common.loading") || "Đang tải..."}</p>`;
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/recommendations?api_key=${TMDB_API_KEY}&language=${apiLang}&page=1`
    );
    const data = await res.json();
    const shows = (data.results || []).slice(0, 12);
    container.innerHTML = "";
    if (!shows.length) {
      container.innerHTML = `<p>${
        t("tvshow.noRecs") || "Không có TV Show đề xuất."
      }</p>`;
      return;
    }
    shows.forEach((s) => {
      let title = s.name;
      if (lang === "vi" && s.name === s.original_name)
        title = translateText(s.original_name, "vi");
      const poster = s.poster_path
        ? `${IMG_URL}${s.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="TvShowDetail.html?id=${s.id}&type=tv">
            <div class="movie-box__info-top"><div class="movie-box__info-ep-top"><span>TV Show</span></div></div>
            <div class="movie-box__poster"><img class="movie-box__poster-img" src="${poster}" alt="${title}"></div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title"><a href="TvShowDetail.html?id=${s.id}">${title}</a></h4>
            <h4 class="movie-box__other-title"><a href="TvShowDetail.html?id=${s.id}">${s.original_name}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (e) {
    container.innerHTML = `<p>${
      t("tvshow.recError") || "Có lỗi khi tải đề xuất."
    }</p>`;
  }
}

// Tab + View more (giữ nguyên selector của file 1)
function initTabs() {
  /* giữ nguyên code file 1 */
}
function initViewMore() {
  /* giữ nguyên code file 1 */
}

// ==================== BOOT ====================
async function boot() {
  await loadTranslations(currentLang());
  translateDOM();
  const tvId = new URLSearchParams(window.location.search).get("id") || 2382;
  await fetchTvDetails(tvId);
  await loadRecommendedTvShows(tvId);
  initTabs();
  initViewMore("#actors .tab-panel__more", "#actors .actors");
  initViewMore("#season-view-more", "#seasons .seasons");
}

// Reload khi đổi ngôn ngữ
window.addEventListener("languagechange", boot);
window.addEventListener("storage", (e) => {
  if (e.key === "language") location.reload();
});

document.addEventListener("DOMContentLoaded", boot);
