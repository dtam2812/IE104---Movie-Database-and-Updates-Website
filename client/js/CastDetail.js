import { TMDB_API_KEY } from "../../config.js";
  const BASE_URL = "https://api.themoviedb.org/3";
  const IMG_URL = "https://image.tmdb.org/t/p/w300";

  const params = new URLSearchParams(window.location.search);
  const personId = params.get("id");

  const personImage = document.getElementById("person-image");
  const personName = document.getElementById("person-name");
  const alsoKnownAs = document.getElementById("also-known-as");
  const biography = document.getElementById("biography");
  const gender = document.getElementById("gender");
  const birthday = document.getElementById("birthday");
  const moviesGrid = document.getElementById("movies-grid");

  let currentPage = 1;
  const perPage = 10;
  let allMovies = [];
  let movieCardTemplate = "";
  let tvCardTemplate = "";

  // Dịch
  let translations = {};
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
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    });
  }
  /* ================== LOAD TEMPLATE ================== */
  async function loadTemplates() {
    try {
      const [movieHTML, tvHTML] = await Promise.all([
        fetch("../components/MovieCardRender.html").then((res) => res.text()),
        fetch("../components/TvShowCardRender.html").then((res) => res.text()),
      ]);
      movieCardTemplate = movieHTML;
      tvCardTemplate = tvHTML;
    } catch (err) {
      console.error("Không tải được template:", err);
    }
  }
  /* ================== LOAD THÔNG TIN DIỄN VIÊN ================== */
  async function loadPersonDetail() {
    const lang = currentLang();
  
    try {
      const res = await fetch(
        `${BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}`
      );
      const data = await res.json();
      if (!data || data.success === false) {
        personName.textContent = t("cast.unknown");
        return;
      }
      // --- Gán dữ liệu ---
      personName.textContent = data.name || t("cast.updating");
      alsoKnownAs.textContent = data.also_known_as[0] || t("cast.updating");
      biography.textContent = data.biography || t("cast.updating");
    
      // Dịch giới tính
      if (data.gender === 1) {
        gender.textContent = t("cast.female");
      } else if (data.gender === 2) {
        gender.textContent = t("cast.male");
      } else {
        gender.textContent = t("cast.unknown");
      }
    
      birthday.textContent = data.birthday || t("cast.updating");
      // --- Ảnh diễn viên ---
      const profile = data.profile_path
        ? `${IMG_URL}${data.profile_path}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            data.name || "Unknown"
          )}&size=300&background=1a1a2e&color=0891b2`;
      personImage.src = profile;
      personImage.onerror = () => {
        personImage.src =
          "https://ui-avatars.com/api/?name=Unknown&size=300&background=1a1a2e&color=0891b2";
      };
    } catch (err) {
      console.error("Lỗi khi tải chi tiết diễn viên:", err);
    }
  }
  /* ================== LOAD DANH SÁCH PHIM/TIVI ================== */
  async function loadPersonMovies() {
    const lang = currentLang();
  
    try {
      const res = await fetch(
        `${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=${tmdbLang(lang)}`
      );
      const data = await res.json();
      if (!data || !data.cast) {
        moviesGrid.innerHTML = `<p>${t("cast.noResults")}</p>`;
        return;
      }
      // --- Sắp xếp giảm dần theo độ phổ biến ---
      allMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
      renderMoviesPage();
    } catch (err) {
      console.error("Lỗi khi tải danh sách phim:", err);
    }
  }
  /* ================== RENDER DANH SÁCH ================== */
  function renderMoviesPage() {
    if (!movieCardTemplate || !tvCardTemplate) return;
    moviesGrid.innerHTML = "";
    const totalPages = Math.ceil(allMovies.length / perPage);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const currentMovies = allMovies.slice(start, end);
    if (currentMovies.length === 0) {
      moviesGrid.innerHTML = `<p>${t("cast.noResults")}</p>`;
      return;
    }
    currentMovies.forEach((item) => {
      // --- Fallback ảnh ---
      const poster = item.poster_path
        ? `${IMG_URL}${item.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
      /* ================== TITLE FALLBACK (MỚI THÊM) ================== */
      let localizedTitle =
        item.title || item.name || "";
      let originalTitle =
        item.original_title || item.original_name || "";
      // TMDB không có tiêu đề theo ngôn ngữ hiện tại → dùng tên gốc
      if (!localizedTitle || localizedTitle.trim().length < 1) {
        localizedTitle = originalTitle;
      }
      if (!localizedTitle) localizedTitle = t("cast.unknown");
      if (!originalTitle || originalTitle.trim().length < 1)
        originalTitle = localizedTitle;
      /* ================================================================ */
      // --- Chọn template (phim hoặc TV show) ---
      let template =
        item.media_type === "tv" ? tvCardTemplate : movieCardTemplate;
      let cardHTML = template
        .replace(/{{id}}/g, item.id)
        .replace(/{{poster}}/g, poster)
        .replace(/{{title}}/g, localizedTitle)
        .replace(/{{original_title}}/g, originalTitle);
      moviesGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
    // fallback ảnh lỗi
    moviesGrid.querySelectorAll("img").forEach((img) => {
      img.onerror = () =>
        (img.src = "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster");
    });
    renderPaginationModern(currentPage, totalPages);
  }
  /* ================== PHÂN TRANG ================== */
  function renderPaginationModern(page, total) {
    const oldPagination = document.querySelector(".pagination-modern");
    if (oldPagination) oldPagination.remove();
    if (total <= 1) return;
    const container = document.createElement("div");
    container.classList.add("pagination-modern");
    const prevBtn = document.createElement("button");
    prevBtn.classList.add("page-circle");
    prevBtn.innerHTML = "&#8592;";
    prevBtn.disabled = page === 1;
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderMoviesPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    const pageBox = document.createElement("div");
    pageBox.classList.add("page-info-box");
    pageBox.innerHTML = `
      <span class="page-text">${t("cast.page")}</span>
      <span class="page-current">${page}</span>
      <span class="page-divider">/</span>
      <span class="page-total">${total}</span>
    `;
    const nextBtn = document.createElement("button");
    nextBtn.classList.add("page-circle");
    nextBtn.innerHTML = "&#8594;";
    nextBtn.disabled = page === total;
    nextBtn.addEventListener("click", () => {
      if (currentPage < total) {
        currentPage++;
        renderMoviesPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    container.appendChild(prevBtn);
    container.appendChild(pageBox);
    container.appendChild(nextBtn);
    moviesGrid.after(container);
  }
  /* ================== BOOT ================== */
  async function boot() {
    const lang = currentLang();
    console.log(`🌐 Current language: ${lang}`);
    await loadTranslations(lang);
    translateDOM();
    await loadTemplates();
    await loadPersonDetail();
    await loadPersonMovies();
    console.log("✅ Cast detail page loaded");
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