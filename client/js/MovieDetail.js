import { TMDB_API_KEY } from "../../config.js";
import { favoritesManager } from "./Favorite.js";

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

// MyMemory Translation + Cache 30 ngày
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

// Fetch movie details
async function fetchMovieDetails(movieId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";

  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${apiLang}&append_to_response=credits,release_dates,images,videos`
    );
    const movie = await res.json();

    // Lưu thông tin phim vào currentMovie để sử dụng cho favorite
    window.currentMovie = {
      id: movieId,
      title: movie.title || movie.original_title,
      originalName: movie.original_title,
      posterPath: movie.poster_path,
      type: "Movie",
    };

    // Ảnh poster
    document.querySelector(".movie-banner__poster img").src = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // Tiêu đề
    document.querySelector(".movie-banner__title h3").textContent =
      movie.title || movie.original_title;

    // Mô tả
    document.querySelector(".movie-banner__overview").innerHTML = `
      <span>${t("detail.intro") || "Giới thiệu"}:</span><br>${
      movie.overview || ""
    }
    `;

    // Điểm IMDb
    document.querySelector(".movie-banner__rating span").textContent =
      movie.vote_average?.toFixed(1) || "N/A";

    // Độ tuổi
    const ratings = movie.release_dates?.results || [];
    const ratingObj =
      ratings.find((r) => r.iso_3166_1 === "US") ||
      ratings.find((r) => r.iso_3166_1 === "GB") ||
      ratings[0];
    const ageRating = ratingObj?.release_dates?.[0]?.certification || "N/A";
    const ageEl = document.querySelector(".movie-banner__age strong");
    if (ageEl) ageEl.textContent = ageRating;

    // Thể loại (TMDB có dịch → dùng luôn, không cần map thủ công)
    document.querySelector(".movie-banner__genres").innerHTML =
      movie.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      `<span>${t("common.unknown")}</span>`;

    // Đạo diễn
    const director =
      movie.credits?.crew?.find((p) => p.job === "Director")?.name ||
      t("common.unknown");
    document.querySelector(".movie-banner__director p").innerHTML = `
      <span>${t("detail.director") || "Đạo diễn"}:</span> ${director}
    `;

    // Background
    const bg = document.querySelector(".movie-banner__background");
    if (bg && movie.backdrop_path) {
      bg.style.backgroundImage = `url(${BG_URL}${movie.backdrop_path})`;
      bg.style.backgroundSize = "cover";
      bg.style.backgroundPosition = "center";
    }

    // Render các phần khác
    renderActors(movie.credits?.cast || []);
    renderInfo(movie);

    // Cập nhật trạng thái nút yêu thích
    updateFavoriteButtonState();

    // Khởi tạo event listener cho nút yêu thích
    initFavoriteButton();
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", error);
  }
}

// Render functions
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
        <h4 class="name"><a href="CastDetail.html?id=${actor.id}">${
    actor.name
  }</a></h4>
        <h4 class="other-name"><a href="#">${actor.original_name || ""}</a></h4>
      </div>
    </div>`;
}

function renderActors(actors) {
  const container = document.querySelector(".actors-grid");
  const btn = document.querySelector(".tab-panel__view-more");
  if (!container) return;

  container.innerHTML = "";
  if (!actors.length) {
    container.innerHTML = `<p>${
      t("detail.noActors") || "Không có thông tin diễn viên."
    }</p>`;
    if (btn) btn.style.display = "none";
    return;
  }

  container.dataset.allActors = JSON.stringify(actors);
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
        ? `${t("detail.viewMore") || "Xem thêm"} (${remain}) ⮟`
        : t("detail.viewMore") || "Xem thêm";
  }
}

function renderInfo(movie) {
  const panel = document.querySelector(".tab-panel--info");
  if (!panel) return;

  const flag =
    movie.production_countries?.[0]?.iso_3166_1?.toLowerCase() || null;
  const flagHTML = flag
    ? `<img src="https://flagcdn.com/48x36/${flag}.png" style="width:32px;height:24px;vertical-align:middle;">`
    : t("common.unknown");

  const releaseDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString("vi-VN")
    : t("common.unknown");

  // Dịch trạng thái phim
  function translateStatus(status) {
    const statusMap = {
      "Released": "detail.status.released",
      "Post Production": "detail.status.postproduction",
      "In Production": "detail.status.inproduction",
      "Planned": "detail.status.planned",
      "Rumored": "detail.status.rumored",
      "Canceled": "detail.status.canceled"
    };
    return t(statusMap[status]) || status || t("common.unknown");
  }

  panel.innerHTML = `
    <h3>${t("detail.infoTitle") || "Thông tin phim"}</h3>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.runtime") || "Thời lượng"
    }:</div><div class="movie-info__value">${
    movie.runtime ? movie.runtime + " " + t("common.minutes") : t("common.unknown")
  }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.country") || "Quốc gia"
    }:</div><div class="movie-info__value">${flagHTML}</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.company") || "Nhà sản xuất"
    }:</div><div class="movie-info__value">${
    movie.production_companies?.[0]?.name || t("common.updating")
  }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.budget") || "Ngân sách"
    }:</div><div class="movie-info__value">${
    movie.budget ? movie.budget.toLocaleString() + " $" : t("common.updating")
  }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.revenue") || "Doanh thu"
    }:</div><div class="movie-info__value">${
    movie.revenue ? movie.revenue.toLocaleString() + " $" : t("common.updating")
  }</div></div>
    <div class="movie-info"><div class="movie-info__label">${
      t("detail.status") || "Trạng thái"
    }:</div><div class="movie-info__value">${translateStatus(movie.status)}</div></div>
  `;
}

// Render recommendations
async function loadRecommendedMovies(movieId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";
  const container = document.getElementById("recommendations");
  if (!container) return;

  container.innerHTML = `<p>${t("common.loading") || "Đang tải..."}</p>`;

  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=${apiLang}&page=1`
    );
    const data = await res.json();
    const movies = (data.results || []).slice(0, 12);

    container.innerHTML = "";
    if (!movies.length) {
      container.innerHTML = `<p>${
        t("detail.noRecs") || "Không có phim đề xuất."
      }</p>`;
      return;
    }

    for (const m of movies) {
      let title = m.title;
      if (lang === "vi" && m.title === m.original_title) {
        title = await translateText(m.original_title, "vi");
      }
      const poster = m.poster_path
        ? `${IMG_URL}${m.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="MovieDetail.html?id=${m.id}">
            <div class="movie-box__info-top"><div class="movie-box__info-ep-top"><span>Movie</span></div></div>
            <div class="movie-box__poster"><img class="movie-box__poster-img" src="${poster}" alt="${title}"></div>
          </a>
          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title"><a href="MovieDetail.html?id=${m.id}">${title}</a></h4>
            <h4 class="movie-box__other-title"><a href="MovieDetail.html?id=${m.id}">${m.original_title}</a></h4>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    }
  } catch (e) {
    container.innerHTML = `<p>${
      t("detail.recError") || "Có lỗi khi tải đề xuất."
    }</p>`;
  }
}

// Render tabs and view more
function initTabs() {
  // Code tab giữ nguyên như file 2 cũ của bạn
  const tabs = document.querySelectorAll(".movie-tabs__item");
  const tabContents = document.querySelectorAll(".movie-tabs__content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // Bỏ active của tất cả tabs và contents
      tabs.forEach((t) => t.classList.remove("movie-tabs__item--active"));
      tabContents.forEach((content) =>
        content.classList.remove("movie-tabs__content--active")
      );

      // Thêm active cho tab được chọn
      this.classList.add("movie-tabs__item--active");

      // Thêm active cho content tương ứng
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("movie-tabs__content--active");
      }
    });
  });
}

function initViewMore() {
  const btn = document.querySelector(".tab-panel__view-more");
  const grid = document.querySelector(".actors-grid");
  if (!btn || !grid) return;

  btn.addEventListener("click", () => {
    const expanded = grid.classList.toggle("actors-grid--expanded");
    const all = JSON.parse(grid.dataset.allActors || "[]");
    grid.innerHTML = "";
    const toShow = expanded ? all : all.slice(0, 5);
    toShow.forEach((a) =>
      grid.insertAdjacentHTML("beforeend", createActorHTML(a))
    );
    btn.textContent = expanded
      ? `${t("detail.collapse") || "Thu gọn"} ⮝`
      : `${t("detail.viewMore") || "Xem thêm"} (${all.length - 5}) ⮟`;
  });
}

// Cập nhật trạng thái nút yêu thích
async function updateFavoriteButtonState() {
  const favoriteBtn = document.querySelector(
    ".movie-banner__button--like, .favorite-btn, .favorite"
  );
  if (!favoriteBtn || !window.currentMovie) return;

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (!token) {
    favoriteBtn.classList.remove("active");
    return;
  }

  try {
    const isFavorite = await favoritesManager.checkFavoriteStatus(
      window.currentMovie.id
    );
    updateFavoriteButtonAppearance(favoriteBtn, isFavorite);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái yêu thích:", error);
  }
}

// Cập nhật giao diện nút yêu thích
function updateFavoriteButtonAppearance(button, isFavorite) {
  const svg = button.querySelector("svg");
  const path = svg?.querySelector("path");

  if (isFavorite) {
    button.classList.add("active");
    if (path) path.style.fill = "#ff4444";
  } else {
    button.classList.remove("active");
    if (path) path.style.fill = "none";
  }
}

// Khởi tạo event listener cho nút yêu thích
function initFavoriteButton() {
  const favoriteBtn = document.querySelector(
    ".movie-banner__button--like, .favorite-btn, .favorite"
  );
  if (!favoriteBtn) return;

  favoriteBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token || !favoritesManager.isValidToken(token)) {
      favoritesManager.showLoginPrompt();
      return;
    }

    if (!window.currentMovie) return;

    try {
      await favoritesManager.handleFavoriteClick(favoriteBtn, {
        id: window.currentMovie.id.toString(),
        type: window.currentMovie.type,
        title: window.currentMovie.title,
        originalName: window.currentMovie.originalName,
        posterPath: IMG_URL + window.currentMovie.posterPath,
      });

      // Cập nhật lại trạng thái nút
      updateFavoriteButtonState();
    } catch (error) {
      console.error("Lỗi khi xử lý yêu thích:", error);
    }
  });
}

// Khởi chạy
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id") || 1242404;

  await loadTranslations(currentLang());
  await fetchMovieDetails(movieId);
  await loadRecommendedMovies(movieId);
  initTabs();
  initViewMore();
});
