import { TMDB_API_KEY } from "./config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// Hàm render chi tiết TV Show
async function fetchTvDetails(tvId) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-Us&append_to_response=credits`
    );
    const tv = await res.json();

    // Ảnh poster
    document.querySelector(".movie-content-left img").src =
      tv.poster_path
        ? `${IMG_URL}${tv.poster_path}`
        : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster&font=roboto";

    // Tiêu đề
    document.querySelector(".movie-content-title h3").textContent =
      tv.name || tv.original_name || "Không rõ";

    // Giới thiệu
    document.querySelector(".movie-content-overview").innerHTML = `
      <span>Giới thiệu:</span><br>${tv.overview || "Không có mô tả"}
    `;

    // Điểm IMDb
    document.querySelector(".movie-content-score span").textContent =
      tv.vote_average?.toFixed(1) || "N/A";

    // Thể loại
    document.querySelector(".movie-content-type").innerHTML =
      tv.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // Nhà sản xuất
    document.querySelector(".movie-content-director p").innerHTML = `
      <span>Nhà sản xuất:</span> ${
        tv.created_by?.[0]?.name || "Không rõ"
      }
    `;

    // Ảnh nền
    const bg = document.querySelector(".background-fade");
    bg.style.backgroundImage = tv.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // Diễn viên
    const actorContainer = document.querySelector(".circle-actor");
    actorContainer.innerHTML = "";
    const allActors = tv.credits?.cast || [];
    const initialActors = allActors.slice(0, 12);
    const remainingActors = allActors.slice(12);

    initialActors.forEach((actor) => {
      const img = actor.profile_path
        ? `${IMG_URL}${actor.profile_path}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            actor.name
          )}&size=500&background=1a1a2e&color=0891b2`;
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

    // Nút "Xem thêm"
    const viewMoreBtn = document.querySelector(".view-more");

    if (viewMoreBtn && allActors.length > 12) {
      viewMoreBtn.style.display = "block";
      viewMoreBtn.style.cursor = "pointer";
      viewMoreBtn.textContent = `Xem thêm (${allActors.length - 12}) ⮟`;

      let isExpanded = false;

      viewMoreBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!isExpanded) {
          remainingActors.forEach((actor) => {
            const img = actor.profile_path
              ? `${IMG_URL}${actor.profile_path}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  actor.name
                )}&size=500&background=1a1a2e&color=0891b2`;
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
          document.querySelectorAll(".extra-actor").forEach((el) => el.remove());
          this.textContent = `Xem thêm (${allActors.length - 12}) ⮟`;
          isExpanded = false;
        }
      });
    } else if (viewMoreBtn) {
      viewMoreBtn.style.display = "none";
    }
    console.log(tv);
    // Thông tin phụ
    document.querySelector(".movie-intro-overview").innerHTML = `
      <h3>Thông tin</h3>
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
    `;

    // ======================
    // Gọi render danh sách mùa
    // ======================
    renderSeasons(tv.seasons);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết TV Show:", error);
  }
}

// Hàm render danh sách mùa
function renderSeasons(seasons) {
  const container = document.getElementById("season-container");
  container.innerHTML = "";

  if (!seasons || !seasons.length) {
    container.innerHTML = "<p>Không có thông tin mùa phim.</p>";
    return;
  }

  seasons
    .filter((s) => s.season_number > 0)
    .forEach((season) => {
      const poster = season.poster_path
        ? `${IMG_URL}${season.poster_path}`
        : "https://placehold.co/150x220?text=No+Poster";

        const rating = season.vote_average || null;

      const html = `
        <div class="season-box">
          <img src="${poster}" alt="${season.name}">
          <div class="season-info">
            <h4>
            ${season.name}
            ${rating ? `<span class="imdb-badge">IMDb <span>${rating.toFixed(1)}</span></span>` : ""}
            </h4>
            <p><strong>Ngày phát sóng:</strong> ${
              season.air_date || "Chưa cập nhật"
            }</p>
            <p><strong>Số tập:</strong> ${season.episode_count || "N/A"}</p>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
    });
}

// Hàm load TV Show đề xuất
async function loadRecommendedTvShows(tvId) {
  const container = document.getElementById("recommendations");
  container.innerHTML = "";

  try {
    const totalPages = 3;
    const allShows = [];

    const fetchPromises = [];
    for (let page = 1; page <= totalPages; page++) {
      fetchPromises.push(
        fetch(
          `${BASE_URL}/tv/${tvId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
        ).then((res) => res.json())
      );
    }

    const results = await Promise.all(fetchPromises);

    results.forEach((data) => {
      if (data.results && data.results.length > 0) {
        allShows.push(...data.results);
      }
    });

    if (!allShows.length) {
      container.innerHTML = "<p>Không có TV Show đề xuất.</p>";
      return;
    }

    allShows.slice(0, 12).forEach((show) => {
      const poster = show.poster_path
        ? `${IMG_URL}${show.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster&font=roboto";

      const html = `
        <div class="movie-box">
          <a class="movie-card" href="TvShowDetail.html?id=${show.id}">
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
    container.innerHTML = "<p>Không thể tải TV Show đề xuất.</p>";
  }
}

// Xử lý chuyển tab (Mobile)
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      this.classList.add("active");

      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

// Khi trang load
document.addEventListener("DOMContentLoaded", () => {
  const tvId =
    new URLSearchParams(window.location.search).get("id") || 2382;

  fetchTvDetails(tvId);
  loadRecommendedTvShows(tvId);
  initTabs();
});
