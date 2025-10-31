import { TMDB_API_KEY } from "../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// ========== HÀM CHÍNH ========== //
async function fetchTvDetails(tvId) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,content_ratings`
    );
    const tv = await res.json();
    console.log(tv);

    // --- Ảnh poster ---
    document.querySelector(".movie-content-left img").src = tv.poster_path
      ? `${IMG_URL}${tv.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // --- Tiêu đề ---
    document.querySelector(".movie-content-title h3").textContent =
      tv.name || tv.original_name || "Không rõ";

    // --- Giới thiệu ---
    document.querySelector(".movie-content-overview").innerHTML = `
        <span>Giới thiệu:</span><br>${tv.overview || "Không có mô tả"}
      `;

    // --- Điểm IMDb ---
    document.querySelector(".movie-content-score span").textContent =
      tv.vote_average?.toFixed(1) || "N/A";

    // --- Giới hạn độ tuổi (Content Rating) ---
    const contentRatings = tv.content_ratings?.results || [];
    // Ưu tiên: US > GB > quốc gia đầu tiên
    const rating =
      contentRatings.find((r) => r.iso_3166_1 === "US") ||
      contentRatings.find((r) => r.iso_3166_1 === "GB") ||
      contentRatings[0];

    const ageRatingElement = document.querySelector(
      ".movie-content-age span strong"
    );
    if (ageRatingElement && rating) {
      ageRatingElement.textContent = rating.rating;
    } else if (ageRatingElement) {
      ageRatingElement.textContent = "N/A";
    }

    // --- Thể loại ---
    document.querySelector(".movie-content-type").innerHTML =
      tv.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // --- Nhà sản xuất chính ---
    document.querySelector(".movie-content-director p").innerHTML = `
        <span>Nhà sản xuất:</span> ${tv.created_by?.[0]?.name || "Không rõ"}
      `;

    // --- Ảnh nền ---
    const bg = document.querySelector(".background-fade");
    bg.style.backgroundImage = tv.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // --- Diễn viên ---
    renderActors(tv.credits?.cast || []);

    // --- Thông tin phim ---
    renderInfo(tv);

    // --- Các mùa phim ---
    renderSeasons(tv.seasons);

    // --- Nhà sản xuất ---
    renderProducers(tv.production_companies);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết TV Show:", error);
  }
}

// ========== TẠO HTML CHO 1 DIỄN VIÊN ========== //
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

// ========== TẠO HTML CHO 1 MÙA PHIM ========== //
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
        ${
          rating
            ? `<p class="imdb-badge">IMDb <span>${rating.toFixed(1)}</span></p>`
            : ""
        }
        <p><strong>Ngày phát sóng:</strong> ${season.air_date || "N/A"}</p>
        <p><strong>Số tập:</strong> ${season.episode_count || "N/A"}</p>
        <p><strong>Giới thiệu:</strong> ${season.overview || "N/A"}</p>
      </div>
    </div>
  `;
}

// ========== RENDER CÁC PHẦN ========== //
function renderActors(actors) {
  const actorContainer = document.querySelector("#actors .circle-actor");
  const viewMoreBtn = document.querySelector("#actors .view-more");

  if (!actorContainer) {
    console.error("Không tìm thấy .circle-actor container");
    return;
  }

  actorContainer.innerHTML = "";

  if (!actors.length) {
    actorContainer.innerHTML = "<p>Không có thông tin diễn viên.</p>";
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
      viewMoreBtn.textContent = `Xem thêm (${actors.length - 5}) ⮟`;
    }
  }
}

function renderInfo(tv) {
  const infoGrid = document.querySelector("#info .info-grid");

  if (!infoGrid) {
    console.error("Không tìm thấy .info-grid container");
    return;
  }

  infoGrid.innerHTML = `
      <h3>Thông tin phim</h3>
      <div class="movie-info">
        <div class="movie-info-title">Số mùa:</div>
        <div class="movie-info-value">${tv.number_of_seasons || "N/A"}</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Tổng số tập:</div>
        <div class="movie-info-value">${tv.number_of_episodes || "N/A"}</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Quốc gia:</div>
        <div class="movie-info-value">${
          tv.production_countries?.[0]?.iso_3166_1
            ? `<img src="https://flagcdn.com/48x36/${tv.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                  alt="${tv.production_countries[0].name}" 
                  style="width: 32px; height: 24px; vertical-align: middle;">`
            : "Không rõ"
        }</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Trạng thái:</div>
        <div class="movie-info-value">${tv.status || "Không rõ"}</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Ngày phát sóng đầu:</div>
        <div class="movie-info-value">${tv.first_air_date || "N/A"}</div>
      </div>
    `;
  console.log(tv);
}

function renderSeasons(seasons) {
  const container = document.querySelector("#seasons .season-list");
  const viewMoreBtn = document.getElementById("season-view-more");

  if (!container) {
    console.error("Không tìm thấy .season-list container");
    return;
  }

  container.innerHTML = "";

  if (!seasons || !seasons.length) {
    container.innerHTML = "<p>Không có thông tin mùa phim.</p>";
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  const validSeasons = seasons.filter((s) => s.season_number > 0);

  if (!validSeasons.length) {
    container.innerHTML = "<p>Không có thông tin mùa phim.</p>";
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  // Lưu toàn bộ danh sách mùa phim vào data attribute
  container.dataset.allSeasons = JSON.stringify(validSeasons);
  // Hiển thị 3 mùa đầu tiên
  const seasonsToShow = validSeasons.slice(0, 3);

  seasonsToShow.forEach((season) => {
  container.insertAdjacentHTML("beforeend", createSeasonHTML(season));
});

  

  // Ẩn nút "Xem thêm" nếu có 2 mùa hoặc ít hơn
  if (viewMoreBtn) {
    if (validSeasons.length <= 3) {
      viewMoreBtn.style.display = "none";
    } else {
      viewMoreBtn.style.display = "block";
      viewMoreBtn.textContent = `Xem thêm (${validSeasons.length - 3}) ⮟`;
    }
  }
}

function renderProducers(producers) {
  const container = document.querySelector("#producers .producer-info");

  if (!container) {
    console.error("Không tìm thấy .producer-info container");
    return;
  }

  container.innerHTML = "";

  if (!producers || !producers.length) {
    container.innerHTML = "<p>Không có thông tin nhà sản xuất.</p>";
    return;
  }

  producers.forEach((company) => {
    const logo = company.logo_path ? `${IMG_URL}${company.logo_path}` : null;

    if (logo) {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="producer-item">
            <img src="${logo}" alt="${company.name}" title="${company.name}" />
          </div>`
      );
    } else {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="producer-item">
            <p><strong>${company.name}</strong></p>
          </div>`
      );
    }
  });
}

// ========== ĐỀ XUẤT TV SHOWS ========== //
async function loadRecommendedTvShows(tvId) {
  const container = document.getElementById("recommendations");

  if (!container) {
    console.error("Không tìm thấy #recommendations container");
    return;
  }

  container.innerHTML = "<p>Đang tải...</p>";

  try {
    let allShows = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(
        `${BASE_URL}/tv/${tvId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
      );
      const data = await res.json();

      if (data.results?.length) {
        allShows = allShows.concat(data.results);
      }

      totalPages = data.total_pages || 1;
      page++;
    } while (page <= totalPages);

    const shows = allShows.slice(0, 12);
    container.innerHTML = "";

    if (!shows.length) {
      container.innerHTML = "<p>Không có TV Show đề xuất.</p>";
      return;
    }

    shows.forEach((show) => {
      const poster = show.poster_path
        ? `${IMG_URL}${show.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

      const html = `
          <div class="movie-box">
            <a class="movie-card" href="TvShowDetail.html?id=${show.id}&type=tv">
              <div class="card-info-top">
                <div class="card-info-ep-top"><span>TV Show</span></div>
              </div>
              <div>
                <img src="${poster}" alt="${show.name}">
              </div>
            </a>
            <div class="info">
              <h4 class="vietnam-title">
                <a href="TvShowDetail.html?id=${show.id}">${show.name}</a>
              </h4>
              <h4 class="other-title">
                <a href="TvShowDetail.html?id=${show.id}">${show.original_name}</a>
              </h4>
            </div>
          </div>
        `;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (error) {
    console.error("Lỗi tải TV Show đề xuất:", error);
    container.innerHTML = "<p>Có lỗi khi tải đề xuất.</p>";
  }
}

// ========== CHUYỂN TAB ========== //
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // Bỏ active của tất cả tabs và contents
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Thêm active cho tab được chọn
      this.classList.add("active");

      // Thêm active cho content tương ứng
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// ========== XEM THÊM (DIỄN VIÊN & MÙA PHIM) ========== //
function initViewMore(buttonSelector, contentSelector) {
  const viewMoreBtn = document.querySelector(buttonSelector);
  const content = document.querySelector(contentSelector);

  if (!viewMoreBtn || !content) return;

  viewMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const isExpanded = content.classList.contains("expanded");

    // Kiểm tra loại nội dung (diễn viên hoặc mùa phim)
    const isActorSection = content.classList.contains("circle-actor");
    const isSeasonSection = content.classList.contains("season-list");

    if (isExpanded) {
      if (isActorSection) {
        const allActors = JSON.parse(content.dataset.allActors || "[]");
        content.innerHTML = "";
        const actorsToShow = allActors.slice(0, 5);

        actorsToShow.forEach((actor) => {
        content.insertAdjacentHTML("beforeend", createActorHTML(actor));
});

        const remaining = allActors.length - 5;
        this.textContent =
          remaining > 0 ? `Xem thêm (${remaining}) ⮟` : "Xem thêm ⮟";
      } else if (isSeasonSection) {
        const allSeasons = JSON.parse(content.dataset.allSeasons || "[]");
        content.innerHTML = "";
        const seasonsToShow = allSeasons.slice(0, 3);

        seasonsToShow.forEach((season) => {
        content.insertAdjacentHTML("beforeend", createSeasonHTML(season));
});

        const remaining = allSeasons.length - 3;
        this.textContent =
          remaining > 0 ? `Xem thêm (${remaining}) ⮟` : "Xem thêm ⮟";
      }

      content.classList.remove("expanded");

      // Cuộn lên đầu section
      const parentSection = content.closest(".grid-layout");
      if (parentSection) {
        parentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // ====== MỞ RỘNG ======
      if (isActorSection) {
        const allActors = JSON.parse(content.dataset.allActors || "[]");
        content.innerHTML = "";
        allActors.forEach((actor) => {
        content.insertAdjacentHTML("beforeend", createActorHTML(actor));
});
      } else if (isSeasonSection) {
        const allSeasons = JSON.parse(content.dataset.allSeasons || "[]");
        content.innerHTML = "";
        allSeasons.forEach((season) => {
  content.insertAdjacentHTML("beforeend", createSeasonHTML(season));
});
      }

      content.classList.add("expanded");
      this.textContent = "Thu gọn ⮝";
    }
  });
}

// ========== KHỞI CHẠY ========== //
document.addEventListener("DOMContentLoaded", () => {
  const tvId = new URLSearchParams(window.location.search).get("id") || 2382;

  fetchTvDetails(tvId);
  loadRecommendedTvShows(tvId);
  initTabs();
  initViewMore("#actors .view-more", "#actors .circle-actor");
  initViewMore("#season-view-more", "#seasons .season-list");
});
