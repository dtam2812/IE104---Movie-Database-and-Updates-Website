import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BG_URL = "https://image.tmdb.org/t/p/original";

let translations = {};

// Hệ thống dịch
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

// Dịch bằng MyMemory + cache 30 ngày
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

function translateDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
}

window.addEventListener("languagechange", () => location.reload());
window.addEventListener("storage", (e) => {
  if (e.key === "language") location.reload();
});

// Chi tiết tv show
async function fetchTvDetails(tvId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";

  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=${apiLang}&append_to_response=credits,content_ratings,created_by,production_companies,seasons`
    );
    const tv = await res.json();

    // Tiêu đề
    let displayTitle = tv.name || tv.original_name;
    if (lang === "vi" && tv.name === tv.original_name) {
      displayTitle = await translateText(tv.original_name, "vi");
    }

    // Mô tả
    let overview = tv.overview || "";
    if (lang === "vi" && (!overview || overview.length < 30)) {
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

    // Tiêu đề
    document.querySelector(".detail__title h3").textContent =
      displayTitle || "Không rõ";

    // Overview
    document.querySelector(".detail__overview").innerHTML = `
      <span>${t("detail.intro") || "Giới thiệu"}:</span><br>${overview}
    `;

    // IMDb score
    document.querySelector(".detail__score span").textContent =
      tv.vote_average?.toFixed(1) || "N/A";

    // Content rating (age)
    const contentRatings = tv.content_ratings?.results || [];
    const rating =
      contentRatings.find((r) => r.iso_3166_1 === "US") ||
      contentRatings.find((r) => r.iso_3166_1 === "GB") ||
      contentRatings[0];

    const ageRatingElement = document.querySelector(".detail__age span strong");
    if (ageRatingElement && rating) {
      ageRatingElement.textContent = rating.rating || "N/A";
    } else if (ageRatingElement) {
      ageRatingElement.textContent = "N/A";
    }

    // Genres (TMDB đã có dịch)
    document.querySelector(".detail__genres").innerHTML =
      tv.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      `<span>${t("common.unknown") || "Không rõ"}</span>`;

    // Nhà sản xuất (created_by)
    document.querySelector(".detail__director p").innerHTML = `
      <span>${t("tvshow.creator") || "Nhà sản xuất"}:</span> ${
      tv.created_by?.[0]?.name || t("common.unknown") || "Không rõ"
    }
    `;

    // Background
    const bg = document.querySelector(".detail__background");
    if (bg && tv.backdrop_path) {
      bg.style.backgroundImage = `url(${BG_URL}${tv.backdrop_path})`;
      bg.style.backgroundSize = "cover";
      bg.style.backgroundPosition = "center";
    }

    // Các phần render khác (giữ nguyên)
    renderActors(tv.credits?.cast || []);
    renderInfo(tv);
    renderSeasons(tv.seasons || []);
    renderProducers(tv.production_companies || []);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết TV Show:", error);
  }
}

//  GIỮ NGUYÊN CÁC HÀM RENDER
function createActorHTML(actor) {
  const img = actor.profile_path
    ? `${IMG_URL}${actor.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        actor.name
      )}&size=300&background=1a1a2e&color=0891b2`;

  return `
    <div class="cast-box actor">
      <a class="cast-card actor__link" href="CastDetail.html?id=${actor.id}">
        <div class="cast-img">
          <img class="actor__img" src="${img}" alt="${actor.name}" />
        </div>
      </a>
      <div class="info">
        <h4 class="name actor__name">
          <a href="CastDetail.html?id=${actor.id}">${actor.name}</a>
        </h4>
        <h4 class="other-name">
          <a href="#">${actor.original_name || ""}</a>
        </h4>
      </div>
    </div>`;
}

function createSeasonHTML(season) {
  const poster = season.poster_path
    ? `${IMG_URL}${season.poster_path}`
    : "https://placehold.co/150x220?text=No+Poster";

  const rating = season.vote_average || null;

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
        <p><strong>${t("detail.airDate") || "Ngày phát sóng"}:</strong> ${
    season.air_date || "N/A"
  }</p>
        <p><strong>${t("detail.episodes") || "Số tập"}:</strong> ${
    season.episode_count || "N/A"
  }</p>
        <p><strong>${t("detail.intro") || "Giới thiệu"}:</strong> ${
    season.overview || "N/A"
  }</p>
      </div>
    </div>
  `;
}

function renderActors(actors) {
  const actorContainer = document.querySelector("#actors .actors");
  const viewMoreBtn = document.querySelector("#actors .tab-panel__more");

  if (!actorContainer) return;

  actorContainer.innerHTML = "";
  if (!actors.length) {
    actorContainer.innerHTML = `<p>${
      t("detail.noActors") || "Không có thông tin diễn viên."
    }</p>`;
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  actorContainer.dataset.allActors = JSON.stringify(actors);
  actors.slice(0, 5).forEach((actor) => {
    actorContainer.insertAdjacentHTML("beforeend", createActorHTML(actor));
  });

  if (viewMoreBtn) {
    const remain = actors.length - 5;
    viewMoreBtn.style.display = remain <= 0 ? "none" : "block";
    viewMoreBtn.textContent =
      remain > 0
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain}) ⮟`
        : `${t("detail.viewMore") || "Xem thêm"} ⮟`;
  }
}

function renderInfo(tv) {
  const infoGrid = document.querySelector("#info .tab-panel--info");
  if (!infoGrid) return;

  const firstAirDate = tv.first_air_date
    ? new Date(tv.first_air_date).toLocaleDateString("vi-VN")
    : "N/A";
  const countryFlag = tv.production_countries?.[0]?.iso_3166_1?.toLowerCase();
  const flagHTML = countryFlag
    ? `<img src="https://flagcdn.com/48x36/${countryFlag}.png" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown") || "Không rõ";

  infoGrid.innerHTML = `
    <h3 class="tab-panel__title">${
      t("detail.infoTitle") || "Thông tin phim"
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
  `;
}

function renderSeasons(seasons) {
  const container = document.querySelector("#seasons .seasons");
  const viewMoreBtn = document.getElementById("season-view-more");
  if (!container) return;

  container.innerHTML = "";
  const validSeasons = (seasons || []).filter((s) => s.season_number > 0);
  if (!validSeasons.length) {
    container.innerHTML = `<p>${
      t("detail.noSeasons") || "Không có thông tin mùa phim."
    }</p>`;
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  container.dataset.allSeasons = JSON.stringify(validSeasons);
  validSeasons.slice(0, 3).forEach((season) => {
    container.insertAdjacentHTML("beforeend", createSeasonHTML(season));
  });

  if (viewMoreBtn) {
    const remain = validSeasons.length - 3;
    viewMoreBtn.style.display = remain <= 0 ? "none" : "block";
    viewMoreBtn.textContent =
      remain > 0
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain}) ⮟`
        : `${t("detail.viewMore") || "Xem thêm"} ⮟`;
  }
}

function renderProducers(producers) {
  const container = document.querySelector("#producers .producers");
  if (!container) return;

  container.innerHTML = "";
  if (!producers?.length) {
    container.innerHTML = `<p>${
      t("detail.noProducers") || "Không có thông tin nhà sản xuất."
    }</p>`;
    return;
  }

  producers.forEach((company) => {
    const logo = company.logo_path ? `${IMG_URL}${company.logo_path}` : null;
    if (logo) {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="producer"><img class="producer__logo" src="${logo}" alt="${company.name}" title="${company.name}" /></div>`
      );
    } else {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="producer"><p class="producer__name"><strong>${company.name}</strong></p></div>`
      );
    }
  });
}

// Recommended (giữ nguyên, thêm dịch title nếu cần)
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
        t("detail.noRecs") || "Không có TV Show đề xuất."
      }</p>`;
      return;
    }

    for (const show of shows) {
      let title = show.name;
      if (lang === "vi" && show.name === show.original_name) {
        title = await translateText(show.original_name, "vi");
      }
      const poster = show.poster_path
        ? `${IMG_URL}${show.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="TvShowDetail.html?id=${show.id}&type=tv">
            <div class="movie-box__info-top"><div class="movie-box__info-ep-top"><span>TV Show</span></div></div>
            <div class="movie-box__poster"><img class="movie-box__poster-img" src="${poster}" alt="${title}"></div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title"><a href="TvShowDetail.html?id=${show.id}">${title}</a></h4>
            <h4 class="movie-box__other-title"><a href="TvShowDetail.html?id=${show.id}">${show.original_name}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    }
  } catch (error) {
    container.innerHTML = `<p>${
      t("detail.recError") || "Có lỗi khi tải đề xuất."
    }</p>`;
  }
}

// Tabs & View More (giữ nguyên)
function initTabs() {
  const tabs = document.querySelectorAll(".tabs__btn");
  const tabContents = document.querySelectorAll(".tabs__content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("tabs__btn--active"));
      tabContents.forEach((c) => c.classList.remove("tabs__content--active"));
      this.classList.add("tabs__btn--active");
      document
        .getElementById(targetTab)
        ?.classList.add("tabs__content--active");
    });
  });
}

function initViewMore(buttonSelector, contentSelector) {
  const btn = document.querySelector(buttonSelector);
  const content = document.querySelector(contentSelector);
  if (!btn || !content) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isExpanded = content.classList.contains("expanded");
    const isActor = content.classList.contains("actors");
    const data = isActor
      ? JSON.parse(content.dataset.allActors || "[]")
      : JSON.parse(content.dataset.allSeasons || "[]");

    content.innerHTML = "";
    const toShow = isExpanded ? data.slice(0, isActor ? 5 : 3) : data;
    toShow.forEach((item) =>
      content.insertAdjacentHTML(
        "beforeend",
        isActor ? createActorHTML(item) : createSeasonHTML(item)
      )
    );

    content.classList.toggle("expanded");
    const remain = data.length - (isActor ? 5 : 3);
    btn.textContent = isExpanded
      ? `${t("detail.viewMore") || "Xem thêm"} ${
          remain > 0 ? `(${remain})` : ""
        } ⮟`
      : `${t("detail.collapse") || "Thu gọn"} ⮝`;
  });
}

// Khởi động
async function boot() {
  await loadTranslations(currentLang());
  translateDOM();

  const urlParams = new URLSearchParams(window.location.search);
  const tvId = urlParams.get("id") || 2382;

  await fetchTvDetails(tvId);
  await loadRecommendedTvShows(tvId);
  initTabs();
  initViewMore("#actors .tab-panel__more", "#actors .actors");
  initViewMore("#season-view-more", "#seasons .seasons");
}

document.addEventListener("DOMContentLoaded", boot);
