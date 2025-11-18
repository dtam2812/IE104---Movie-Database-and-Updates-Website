// ============================================================
// PHẦN 1: THÊM MỚI - Hệ thống dịch (không động đến code cũ)
// ============================================================

let translations = {};

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
    const translated = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });
}

// Translation API với cache
async function translateText(text, targetLang) {
  if (!text || targetLang === "en") return text;

  const cacheKey = `translation_${text.substring(0, 50)}_${targetLang}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText || text;
    localStorage.setItem(cacheKey, translated);
    return translated;
  } catch {
    return text;
  }
}

// ============================================================
// PHẦN 2: CODE CŨ - CHỈ SỬA NHỮNG CHỖ CẦN THIẾT (đánh dấu ⚠️)
// ============================================================

import { TMDB_API_KEY } from "../../config.js";
import { favoritesManager } from "../js/Favorite.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// ========== HÀM CHÍNH ========== //
async function fetchMovieDetails(movieId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";

  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${apiLang}&append_to_response=credits`
    );
    const movie = await res.json();

    // =======================================================
    // ⚠️ THÊM MỚI: DỊCH TÊN PHIM nếu TMDB không có bản dịch
    // =======================================================
    let displayTitle = movie.title || movie.original_title;

    if (lang === "vi" && movie.title === movie.original_title) {
      displayTitle = await translateText(movie.title, "vi");
    }
    // =======================================================

    // Lưu thông tin phim vào currentMovie để sử dụng cho favorite
    window.currentMovie = {
      id: movieId,
      title: displayTitle,
      originalName: movie.original_title,
      posterPath: movie.poster_path,
      type: "Movie",
    };

    // ⚠️ THÊM: Xử lý overview nếu thiếu
    let overview = movie.overview || "";
    if (lang === "vi" && overview.length < 20) {
      const enRes = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const enMovie = await enRes.json();
      overview = await translateText(enMovie.overview, "vi");
    }

    // --- Ảnh poster ---
    document.querySelector(".movie-banner__poster img").src = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // --- Tiêu đề --- ⚠️ SỬA dùng displayTitle
    document.querySelector(".movie-banner__title h3").textContent =
      displayTitle;

    // --- Giới thiệu ---
    document.querySelector(".movie-banner__overview").innerHTML = `
      <span>${t("detail.intro")}</span><br>${
      overview || t("detail.noOverview")
    }`;

    // --- Điểm IMDb ---
    document.querySelector(".movie-banner__rating span").textContent =
      movie.vote_average?.toFixed(1) || "N/A";

    // --- Thể loại ---
    document.querySelector(".movie-banner__genres").innerHTML =
      movie.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      `<span>${t("common.unknown")}</span>`;

    // --- Đạo diễn ---
    const director =
      movie.credits?.crew?.find((p) => p.job === "Director")?.name ||
      t("common.unknown");
    document.querySelector(".movie-banner__director p").innerHTML = `
      <span>${t("detail.director")}</span> ${director}`;

    // --- Ảnh nền ---
    const bg = document.querySelector(".movie-banner__background");
    bg.style.backgroundImage = movie.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // --- Diễn viên ---
    renderActors(movie.credits?.cast || []);

    // --- Thông tin phim ---
    renderInfo(movie);

    // Cập nhật trạng thái nút yêu thích
    updateFavoriteButtonState();

    // Khởi tạo event listener cho nút yêu thích
    initFavoriteButton();
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", error);
  }
}

// ========== TẠO HTML CHO 1 DIỄN VIÊN ==========
function createActorHTML(actor) {
  const img = actor.profile_path
    ? `${IMG_URL}${actor.profile_path}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        actor.name
      )}&size=300&background=1a1a2e&color=0891b2`;

  return `
    <div class="cast-box">
      <a class="cast-card" href="CastDetail.html?id=${actor.id}">
        <div class="cast-img">
          <img src="${img}" alt="${actor.name}" />
        </div>
      </a>
      <div class="info">
        <h4 class="name">
          <a href="CastDetail.html?id=${actor.id}">${actor.name}</a>
        </h4>
        <h4 class="other-name">
          <a href="#">${actor.original_name}</a>
        </h4>
      </div>
    </div>`;
}

// ========== RENDER DIỄN VIÊN ==========
function renderActors(actors) {
  const actorContainer = document.querySelector(".actors-grid");
  const viewMoreBtn = document.querySelector(".tab-panel__view-more");

  if (!actorContainer) {
    console.error("Không tìm thấy .actors-grid container");
    return;
  }

  actorContainer.innerHTML = "";

  if (!actors.length) {
    actorContainer.innerHTML = `<p>${t("detail.noActors")}</p>`;
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  // Lưu toàn bộ danh sách diễn viên vào data attribute
  actorContainer.dataset.allActors = JSON.stringify(actors);

  // Hiển thị 5 diễn viên đầu tiên
  const actorsToShow = actors.slice(0, 5);

  actorsToShow.forEach((actor) => {
    actorContainer.insertAdjacentHTML("beforeend", createActorHTML(actor));
  });

  // Ẩn nút "Xem thêm" nếu có 5 diễn viên hoặc ít hơn
  if (viewMoreBtn) {
    if (actors.length <= 5) {
      viewMoreBtn.style.display = "none";
    } else {
      viewMoreBtn.style.display = "block";
      viewMoreBtn.textContent = `${t("detail.viewMore")} (${
        actors.length - 5
      }) ⮟`;
    }
  }
}

// Hàm dịch status
function translateStatus(status) {
  if (!status) return t("common.unknown") || "Không rõ";

  const statusMap = {
    Released: t("detail.status.released") || "Đã phát hành",
    "Post Production": t("detail.status.postproduction") || "Hậu kỳ",
    "In Production": t("detail.status.inproduction") || "Đang sản xuất",
    Planned: t("detail.status.planned") || "Đã lên kế hoạch",
    Rumored: t("detail.status.rumored") || "Tin đồn",
    Canceled: t("detail.status.canceled") || "Đã hủy",
  };

  return statusMap[status] || status;
}

// ========== RENDER INFO ==========
function renderInfo(movie) {
  const infoPanel = document.querySelector(".tab-panel--info");

  if (!infoPanel) {
    console.error("Không tìm thấy .tab-panel--info container");
    return;
  }

  const releaseDate = new Date(movie.release_date);

  infoPanel.innerHTML = `
    <h3>${t("detail.infoTitle")}</h3>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.runtime")}</div>
      <div class="movie-info__value">${
        movie.runtime
          ? movie.runtime + " " + t("common.minutes")
          : t("common.unknown")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.country")}</div>
      <div class="movie-info__value">${
        movie.production_countries?.[0]?.iso_3166_1
          ? `<img src="https://flagcdn.com/48x36/${movie.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                alt="${movie.production_countries[0].name}" 
                style="width: 32px; height: 24px; vertical-align: middle;">`
          : t("common.unknown")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.company")}</div>
      <div class="movie-info__value">${
        movie.production_companies?.[0]?.name || t("common.updating")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.budget")}</div>
      <div class="movie-info__value">${
        movie.budget
          ? movie.budget.toLocaleString() + " $"
          : t("common.updating")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.revenue")}</div>
      <div class="movie-info__value">${
        movie.revenue
          ? movie.revenue.toLocaleString() + " $"
          : t("common.updating")
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.status")}</div>
      <div class="movie-info__value">${translateStatus(movie.status)}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">${t("detail.releaseDate")}</div>
      <div class="movie-info__value">${
        releaseDate.toLocaleDateString(
          currentLang() === "vi" ? "vi-VN" : "en-US"
        ) || t("common.updating")
      }</div>
    </div>
  `;
}

// ========== PHIM ĐỀ XUẤT ==========
async function loadRecommendedMovies(movieId) {
  const lang = currentLang();
  const apiLang = lang === "vi" ? "vi-VN" : "en-US";
  const container = document.getElementById("recommendations");

  if (!container) {
    console.error("Không tìm thấy #recommendations container");
    return;
  }

  container.innerHTML = `<p>${t("common.loading")}</p>`;

  try {
    let allMovies = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(
        `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=${apiLang}&page=${page}`
      );
      const data = await res.json();

      if (data.results?.length) {
        allMovies = allMovies.concat(data.results);
      }

      totalPages = data.total_pages || 1;
      page++;
    } while (page <= totalPages);

    const movies = allMovies.slice(0, 12);
    container.innerHTML = "";

    if (!movies.length) {
      container.innerHTML = `<p>${t("detail.noRecs")}</p>`;
      return;
    }

    movies.forEach((movie) => {
      const poster = movie.poster_path
        ? `${IMG_URL}${movie.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const html = `
        <div class="movie-box">
          <a class="movie-box__card" href="MovieDetail.html?id=${movie.id}">
            <div class="movie-box__info-top">
              <div class="movie-box__info-ep-top"><span>Movie</span></div>
            </div>

            <div class="movie-box__poster">
              <img class="movie-box__poster-img" src="${poster}" alt="${movie.title}">
            </div>
          </a>

          <div class="movie-box__info">
            <h4 class="movie-box__vietnam-title">
              <a class="movie-box__title-link" href="MovieDetail.html?id=${movie.id}">
                ${movie.title}
              </a>
            </h4>

            <h4 class="movie-box__other-title">
              <a class="movie-box__title-link" href="MovieDetail.html?id=${movie.id}">
                ${movie.original_title}
              </a>
            </h4>
          </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (error) {
    console.error("Lỗi tải phim đề xuất:", error);
    container.innerHTML = `<p>${t("detail.recError")}</p>`;
  }
}

// ========== CHUYỂN TAB ==========
function initTabs() {
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

// ========== XEM THÊM DIỄN VIÊN ==========
function initViewMore() {
  const viewMoreBtn = document.querySelector(".tab-panel__view-more");
  const content = document.querySelector(".actors-grid");

  if (!viewMoreBtn || !content) return;

  viewMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const isExpanded = content.classList.contains("actors-grid--expanded");

    if (isExpanded) {
      // Thu gọn
      const allActors = JSON.parse(content.dataset.allActors || "[]");
      content.innerHTML = "";
      const actorsToShow = allActors.slice(0, 5);

      actorsToShow.forEach((actor) => {
        content.insertAdjacentHTML("beforeend", createActorHTML(actor));
      });

      const remaining = allActors.length - 5;
      this.textContent =
        remaining > 0
          ? `${t("detail.viewMore")} (${remaining}) ⮟`
          : `${t("detail.viewMore")} ⮟`;

      content.classList.remove("actors-grid--expanded");

      // Cuộn lên đầu section
      const parentSection = content.closest(".tab-panel");
      if (parentSection) {
        parentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Mở rộng
      const allActors = JSON.parse(content.dataset.allActors || "[]");
      content.innerHTML = "";
      allActors.forEach((actor) => {
        content.insertAdjacentHTML("beforeend", createActorHTML(actor));
      });

      content.classList.add("actors-grid--expanded");
      this.textContent = `${t("detail.collapse")} ⮝`;
    }
  });
}

// ========== YÊU THÍCH ==========
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

// ========== KHỞI CHẠY ==========
async function boot() {
  await loadTranslations(currentLang());
  translateDOM();

  const movieId =
    new URLSearchParams(window.location.search).get("id") || 1242404;

  await fetchMovieDetails(movieId);
  await loadRecommendedMovies(movieId);
  initTabs();
  initViewMore();
}

document.addEventListener("DOMContentLoaded", boot);

// ⚠️ THÊM MỚI: Nghe sự kiện đổi ngôn ngữ
window.addEventListener("languagechange", async (e) => {
  console.log("🔄 Language changed to:", e.detail.lang);
  await boot();
});

// Lắng nghe storage change
window.addEventListener("storage", (e) => {
  if (e.key === "language") {
    location.reload();
  }
});
