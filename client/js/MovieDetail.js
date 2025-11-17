import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// Hàm chính
async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,release_dates`
    );
    const movie = await res.json();

    // Ảnh poster
    document.querySelector(".movie-banner__poster img").src = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // Tiêu đề
    document.querySelector(".movie-banner__title h3").textContent =
      movie.title || movie.original_title || "Không rõ";

    // Giới thiệu
    document.querySelector(".movie-banner__overview").innerHTML = `
      <span>Giới thiệu:</span><br>${movie.overview || "Không có mô tả"}
    `;

    // Điểm IMDb
    document.querySelector(".movie-banner__rating span").textContent =
      movie.vote_average?.toFixed(1) || "N/A";

    // Độ tuổi (Age Rating)
    const releaseDates = movie.release_dates?.results || [];
    const ratingObj =
      releaseDates.find(r => r.iso_3166_1 === "US") ||
      releaseDates.find(r => r.iso_3166_1 === "GB") ||
      releaseDates[0];

    const ageRating = ratingObj?.release_dates[0]?.certification || "N/A";

    const ageElement = document.querySelector(".movie-banner__age strong");
    if (ageElement) ageElement.textContent = ageRating;


    // Thể loại
    document.querySelector(".movie-banner__genres").innerHTML =
      movie.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // Đạo diễn
    const director =
      movie.credits?.crew?.find((p) => p.job === "Director")?.name ||
      "Không rõ";
    document.querySelector(".movie-banner__director p").innerHTML = `
      <span>Đạo diễn:</span> ${director}
    `;

    // Ảnh nền
    const bg = document.querySelector(".movie-banner__background");
    bg.style.backgroundImage = movie.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // Diễn viên
    renderActors(movie.credits?.cast || []);

    // Thông tin phim
    renderInfo(movie);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", error);
  }
}

// Tạo HTML cho 1 diễn viên
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

// Render các phần
function renderActors(actors) {
  const actorContainer = document.querySelector(".actors-grid");
  const viewMoreBtn = document.querySelector(".tab-panel__view-more");

  if (!actorContainer) {
    console.error("Không tìm thấy .actors-grid container");
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

function renderInfo(movie) {
  const infoPanel = document.querySelector(".tab-panel--info");

  if (!infoPanel) {
    console.error("Không tìm thấy .tab-panel--info container");
    return;
  }
  const releaseDate = new Date(movie.release_date);

  infoPanel.innerHTML = `
    <h3>Thông tin phim</h3>
    <div class="movie-info">
      <div class="movie-info__label">Thời lượng:</div>
      <div class="movie-info__value">${
        movie.runtime ? movie.runtime + " phút" : "Không rõ"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Quốc gia:</div>
      <div class="movie-info__value">${
        movie.production_countries?.[0]?.iso_3166_1
          ? `<img src="https://flagcdn.com/48x36/${movie.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                alt="${movie.production_countries[0].name}" 
                style="width: 32px; height: 24px; vertical-align: middle;">`
          : "Không rõ"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Nhà sản xuất:</div>
      <div class="movie-info__value">${
        movie.production_companies?.[0]?.name || "Đang cập nhật"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Ngân sách:</div>
      <div class="movie-info__value">${
        movie.budget ? movie.budget.toLocaleString() + " $" : "Đang cập nhật"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Doanh thu:</div>
      <div class="movie-info__value">${
        movie.revenue ? movie.revenue.toLocaleString() + " $" : "Đang cập nhật"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Trạng thái:</div>
      <div class="movie-info__value">${movie.status || "Đang cập nhật"}</div>
    </div>
    <div class="movie-info">
      <div class="movie-info__label">Ngày ra mắt:</div>
      <div class="movie-info__value">${
        releaseDate.toLocaleDateString("vi-VN") || "Đang cập nhật"
      }</div>
    </div>
  `;
}

// Đề xuất phim
async function loadRecommendedMovies(movieId) {
  const container = document.getElementById("recommendations");

  if (!container) {
    console.error("Không tìm thấy #recommendations container");
    return;
  }

  container.innerHTML = "<p>Đang tải...</p>";

  try {
    let allMovies = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(
        `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
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
      container.innerHTML = "<p>Không có phim đề xuất.</p>";
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
    container.innerHTML = "<p>Có lỗi khi tải đề xuất.</p>";
  }
}

// Chuyển Tab
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

// Xem thêm /thu gọn diễn viên
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
        remaining > 0 ? `Xem thêm (${remaining}) ⮟` : "Xem thêm ⮟";

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
      this.textContent = "Thu gọn ⮝";
    }
  });
}

// Khởi chạy
document.addEventListener("DOMContentLoaded", () => {
  const movieId =
    new URLSearchParams(window.location.search).get("id") || 1242404;

  fetchMovieDetails(movieId);
  loadRecommendedMovies(movieId);
  initTabs();
  initViewMore();
});