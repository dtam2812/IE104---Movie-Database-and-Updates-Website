import { TMDB_API_KEY } from "../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// ========== HÀM CHÍNH ========== //
async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits`
    );
    const movie = await res.json();

    // --- Ảnh poster ---
    document.querySelector(".movie-content-left img").src = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // --- Tiêu đề ---
    document.querySelector(".movie-content-title h3").textContent =
      movie.title || movie.original_title || "Không rõ";

    // --- Giới thiệu ---
    document.querySelector(".movie-content-overview").innerHTML = `
      <span>Giới thiệu:</span><br>${movie.overview || "Không có mô tả"}
    `;

    // --- Điểm IMDb ---
    document.querySelector(".movie-content-score span").textContent =
      movie.vote_average?.toFixed(1) || "N/A";

    // --- Thể loại ---
    document.querySelector(".movie-content-type").innerHTML =
      movie.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // --- Đạo diễn ---
    const director =
      movie.credits?.crew?.find((p) => p.job === "Director")?.name ||
      "Không rõ";
    document.querySelector(".movie-content-director p").innerHTML = `
      <span>Đạo diễn:</span> ${director}
    `;

    // --- Ảnh nền ---
    const bg = document.querySelector(".background-fade");
    bg.style.backgroundImage = movie.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // --- Diễn viên ---
    renderActors(movie.credits?.cast || []);

    // --- Thông tin phim ---
    renderInfo(movie);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", error);
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

function renderInfo(movie) {
  const infoGrid = document.querySelector("#info .info-grid");

  if (!infoGrid) {
    console.error("Không tìm thấy .info-grid container");
    return;
  }

  infoGrid.innerHTML = `
    <h3>Thông tin phim</h3>
    <div class="movie-info">
      <div class="movie-info-title">Thời lượng:</div>
      <div class="movie-info-value">${
        movie.runtime ? movie.runtime + " phút" : "Không rõ"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title">Quốc gia:</div>
      <div class="movie-info-value">${
        movie.production_countries?.[0]?.iso_3166_1
          ? `<img src="https://flagcdn.com/48x36/${movie.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                alt="${movie.production_countries[0].name}" 
                style="width: 32px; height: 24px; vertical-align: middle;">`
          : "Không rõ"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title">Nhà sản xuất:</div>
      <div class="movie-info-value">${
        movie.production_companies?.[0]?.name || "Không rõ"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title">Ngân sách:</div>
      <div class="movie-info-value">${
        movie.budget ? movie.budget.toLocaleString() + " $" : "Đang cập nhật"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title">Doanh thu:</div>
      <div class="movie-info-value">${
        movie.revenue ? movie.revenue.toLocaleString() + " $" : "Đang cập nhật"
      }</div>
    </div>
    <div class="movie-info">
      <div class="movie-info-title">Trạng thái:</div>
      <div class="movie-info-value">${movie.status || "Không rõ"}</div>
    </div>
  `;
  console.log(movie);
}

// ========== ĐỀ XUẤT PHIM ========== //
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
          <a class="movie-card" href="MovieDetail.html?id=${movie.id}">
            <div class="card-info-top">
              <div class="card-info-ep-top"><span>Movie</span></div>
            </div>
            <div>
              <img src="${poster}" alt="${movie.title}">
            </div>
          </a>
          <div class="info">
            <h4 class="vietnam-title">
              <a href="MovieDetail.html?id=${movie.id}">${movie.title}</a>
            </h4>
            <h4 class="other-title">
              <a href="MovieDetail.html?id=${movie.id}">${movie.original_title}</a>
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

// ========== XEM THÊM (DIỄN VIÊN) ========== //
function initViewMore(buttonSelector, contentSelector) {
  const viewMoreBtn = document.querySelector(buttonSelector);
  const content = document.querySelector(contentSelector);

  if (!viewMoreBtn || !content) return;

  viewMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const isExpanded = content.classList.contains("expanded");

    if (isExpanded) {
      // ====== THU GỌN ======
      const allActors = JSON.parse(content.dataset.allActors || "[]");
      content.innerHTML = "";
      const actorsToShow = allActors.slice(0, 5);

      actorsToShow.forEach((actor) => {
      content.insertAdjacentHTML("beforeend", createActorHTML(actor));
});
      const remaining = allActors.length - 5;
      this.textContent =
        remaining > 0 ? `Xem thêm (${remaining}) ⮟` : "Xem thêm ⮟";

      content.classList.remove("expanded");

      // Cuộn lên đầu section
      const parentSection = content.closest(".grid-layout");
      if (parentSection) {
        parentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // ====== MỞ RỘNG ======
      const allActors = JSON.parse(content.dataset.allActors || "[]");
      content.innerHTML = "";
      allActors.forEach((actor) => {
      content.insertAdjacentHTML("beforeend", createActorHTML(actor));
});

      content.classList.add("expanded");
      this.textContent = "Thu gọn ⮝";
    }
  });
}

// ========== KHỞI CHẠY ========== //
document.addEventListener("DOMContentLoaded", () => {
  const movieId =
    new URLSearchParams(window.location.search).get("id") || 1242404;

  fetchMovieDetails(movieId);
  loadRecommendedMovies(movieId);
  initTabs();
  initViewMore("#actors .view-more", "#actors .circle-actor");
});
