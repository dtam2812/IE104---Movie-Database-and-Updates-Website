import { TMDB_API_KEY } from "./config.js";

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
    document.querySelector(".movie-content-left img").src =
      movie.poster_path
        ? `${IMG_URL}${movie.poster_path}`
        : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster&font=roboto";

    // Tiêu đề
    document.querySelector(".movie-content-title h3").textContent =
      movie.title;

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
    const allActors = movie.credits?.cast || [];
    const initialActors = allActors.slice(0, 6);
    const remainingActors = allActors.slice(6);

    initialActors.forEach((actor) => {
      const img = actor.profile_path
        ? `${IMG_URL}${actor.profile_path}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&size=500&background=1a1a2e&color=0891b2`;
      actorContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="actor-item">
          <a href="#"><img src="${img}" alt="${actor.name}"></a>
          <p class="actor-name">${actor.name}</p>
        </div>
      `
      );
    });

    // Xử lý nút "Xem thêm"
    const viewMoreBtn = document.querySelector(".view-more");

if (viewMoreBtn && allActors.length > 12) {
  viewMoreBtn.style.display = "block";
  viewMoreBtn.style.cursor = "pointer";
  viewMoreBtn.textContent = `Xem thêm (${allActors.length - 12}) ⮟`;

  let isExpanded = false;

  // Ban đầu chỉ hiển thị 12 diễn viên đầu tiên
  const initialActors = allActors.slice(0, 12);
  const remainingActors = allActors.slice(12);

  // Render 12 diễn viên đầu
  actorContainer.innerHTML = "";
  initialActors.forEach((actor) => {
    const img = actor.profile_path
      ? `${IMG_URL}${actor.profile_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&size=500&background=1a1a2e&color=0891b2`;
    actorContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="actor-item">
        <a href="#"><img src="${img}" alt="${actor.name}"></a>
        <p class="actor-name">${actor.name}</p>
      </div>
    `
    );
  });

  // Sự kiện click "Xem thêm"
  viewMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isExpanded) {
      // Hiện toàn bộ diễn viên
      remainingActors.forEach((actor) => {
        const img = actor.profile_path
          ? `${IMG_URL}${actor.profile_path}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&size=500&background=1a1a2e&color=0891b2`;
        actorContainer.insertAdjacentHTML(
          "beforeend",
          `
          <div class="actor-item extra-actor">
            <a href="#"><img src="${img}" alt="${actor.name}"></a>
            <p class="actor-name">${actor.name}</p>
          </div>
        `
        );
      });

      this.textContent = "Thu gọn ⮝";
      isExpanded = true;
    } else {
      // Thu gọn lại còn 12 diễn viên đầu
      document.querySelectorAll(".extra-actor").forEach((el) => el.remove());
      this.textContent = `Xem thêm (${allActors.length - 12}) ⮟`;
      isExpanded = false;
    }
  });
} else if (viewMoreBtn) {
  viewMoreBtn.style.display = "none";
}
  console.log(movie);
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
          movie.production_countries?.[0]?.iso_3166_1 
            ? `<img src="https://flagcdn.com/48x36/${movie.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                alt="${movie.production_countries[0].name}" 
                style="width: 32px; height: 24px; vertical-align: middle;">`
            : "Không rõ"
        }</div>
      </div>
      <div class="movie-info">
        <div class="movie-info-title">Sản xuất:</div>
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
        <div class="movie-info-value">${
          movie.status || "Không rõ"
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
        fetch(`${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`)
          .then(res => res.json())
      );
    }

    const results = await Promise.all(fetchPromises);
    
    // Gộp tất cả kết quả
    results.forEach(data => {
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
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster&font=roboto";

        // Xác định loại nội dung (Movie hoặc TV Show)
      const mediaType = movie.media_type === 'tv' ? 'TV Show' : 'Movie';
      
      // Lấy title phù hợp
      const title = movie.title || movie.name;
      const originalTitle = movie.original_title || movie.original_name;

      const movieBox = `
        <div class="movie-box">
          <a class="movie-card" href="MovieDetail.html?id=${movie.id}">
            <div class="card-info-top">
              <div class="card-info-ep-top"><span>${mediaType}</span></div>
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
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // Remove active class từ tất cả tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Remove active class từ tất cả tab contents
      tabContents.forEach(content => content.classList.remove('active'));

      // Thêm active class cho tab được click
      this.classList.add('active');

      // Hiển thị nội dung tương ứng
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
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