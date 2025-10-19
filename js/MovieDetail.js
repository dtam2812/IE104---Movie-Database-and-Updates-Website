import { TMDB_API_KEY } from "../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const TRANSLATE_URL = "https://libretranslate.com/translate";

// Hàm render chi tiết phim
async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&page=1&append_to_response=credits`
    );
    const movie = await res.json();

    // Ảnh poster
    document.querySelector(".movie-content-left img").src = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";

    // Tiêu đề
    document.querySelector(".movie-content-title h3").textContent = movie.title;

    // Giới thiệu
    document.querySelector(".movie-content-overview").innerHTML = `
      <span>Giới thiệu:</span><br>${movie.overview || "Không có mô tả"}
    `;

    // Điểm IMDb
    document.querySelector(".movie-content-score span").textContent =
      movie.vote_average?.toFixed(1) || "N/A";

    // Thể loại
    document.querySelector(".movie-content-type").innerHTML =
      movie.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // Đạo diễn
    const director =
      movie.credits?.crew?.find((p) => p.job === "Director")?.name ||
      "Không rõ";
    document.querySelector(".movie-content-director p").innerHTML = `
      <span>Đạo diễn:</span> ${director}
    `;

    // Ảnh nền
    const bg = document.querySelector(".background-fade");
    bg.style.backgroundImage = movie.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // Diễn viên
    const actorContainer = document.querySelector(".circle-actor");
    actorContainer.innerHTML = "";
    movie.credits?.cast?.slice(0, 6).forEach((actor) => {
      const img = actor.profile_path
        ? `${IMG_URL}${actor.profile_path}`
        : "https://via.placeholder.com/100?text=No+Img";
      actorContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="actor-item">
          <a href="#"><img src="${img}" alt="${actor.name}"></a>
          <p class="actor-name">${actor.name}</p>
        </div>
      `
      );
      console.log(movie);
    });

    // Thông tin phụ
    document.querySelector(".movie-intro-overview").innerHTML = `
      <h3>Thông tin</h3>
      <div class="movie-info">
        <div class="movie-info-title">Thời lượng:</div>
        <div class="movie-info-value">${
          movie.runtime ? movie.runtime + " phút" : "Không rõ"
        }</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Quốc gia:</div>
        <div class="movie-info-value">${
          movie.production_countries?.[0]?.name || "Không rõ"
        }</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Sản xuất:</div>
        <div class="movie-info-value">${
          movie.production_companies?.[0]?.name || "Không rõ"
        }</div>
      </div>
    `;
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", error);
  }
}
// Hàm load phim đề xuất
async function loadRecommendedMovies(movieId) {
  const container = document.getElementById("recommendations");
  container.innerHTML = ""; // reset nội dung

  try {
    const totalPages = 3; // Số trang muốn lấy
    const allMovies = [];

    // Fetch nhiều trang cùng lúc
    const fetchPromises = [];
    for (let page = 1; page <= totalPages; page++) {
      fetchPromises.push(
        fetch(
          `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
        ).then((res) => res.json())
      );
    }

    const results = await Promise.all(fetchPromises);

    // Gộp tất cả kết quả
    results.forEach((data) => {
      if (data.results && data.results.length > 0) {
        allMovies.push(...data.results);
      }
    });

    if (!allMovies.length) {
      container.innerHTML = "<p>Không có phim đề xuất.</p>";
      return;
    }

    // Hiển thị phim (lấy tối đa 12 phim từ 3 trang)
    allMovies.slice(0, 12).forEach((movie) => {
      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

      const movieBox = `
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
      container.insertAdjacentHTML("beforeend", movieBox);
    });
  } catch (error) {
    console.error("Lỗi tải phim đề xuất:", error);
    container.innerHTML = "<p>Không thể tải phim đề xuất.</p>";
  }
}

// Xử lý chuyển tab (Mobile)
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // Remove active class từ tất cả tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Remove active class từ tất cả tab contents
      tabContents.forEach((content) => content.classList.remove("active"));

      // Thêm active class cho tab được click
      this.classList.add("active");

      // Hiển thị nội dung tương ứng
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// Khi trang load
document.addEventListener("DOMContentLoaded", () => {
  const movieId =
    new URLSearchParams(window.location.search).get("id") || 1242404;

  fetchMovieDetails(movieId);
  loadRecommendedMovies(movieId);
  initTabs();
});
