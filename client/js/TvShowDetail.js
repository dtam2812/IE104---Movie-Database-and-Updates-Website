import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// Main function
async function fetchTvDetails(tvId) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,content_ratings`
    );
    const tv = await res.json();
    console.log(tv);

    // Poster image
    document.querySelector(".detail__poster img").src = tv.poster_path
      ? `${IMG_URL}${tv.poster_path}`
      : "https://placehold.co/500x750/1a1a2e/0891b2?text=No+Poster";

    // Title
    document.querySelector(".detail__title h3").textContent =
      tv.name || tv.original_name || "Không rõ";

    // Overview
    document.querySelector(".detail__overview").innerHTML = `
        <span>Giới thiệu:</span><br>${tv.overview || "Không có mô tả"}
      `;

    // IMDb score
    document.querySelector(".detail__score span").textContent =
      tv.vote_average?.toFixed(1) || "N/A";

    // Content rating (age restriction)
    const contentRatings = tv.content_ratings?.results || [];
    // Priority: US > GB > first country
    const rating =
      contentRatings.find((r) => r.iso_3166_1 === "US") ||
      contentRatings.find((r) => r.iso_3166_1 === "GB") ||
      contentRatings[0];

    const ageRatingElement = document.querySelector(".detail__age span strong");
    if (ageRatingElement && rating) {
      ageRatingElement.textContent = rating.rating;
    } else if (ageRatingElement) {
      ageRatingElement.textContent = "N/A";
    }

    // Genres
    document.querySelector(".detail__genres").innerHTML =
      tv.genres?.map((g) => `<span>${g.name}</span>`).join("") ||
      "<span>Không rõ</span>";

    // Main producer
    document.querySelector(".detail__director p").innerHTML = `
        <span>Nhà sản xuất:</span> ${tv.created_by?.[0]?.name || "Không rõ"}
      `;

    // Background image
    const bg = document.querySelector(".detail__background");
    bg.style.backgroundImage = tv.backdrop_path
      ? `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})`
      : "none";
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";

    // Actors
    renderActors(tv.credits?.cast || []);

    // Info
    renderInfo(tv);

    // Seasons
    renderSeasons(tv.seasons);

    // Producers
    renderProducers(tv.production_companies);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết TV Show:", error);
  }
}

// Create HTML for one actor
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
          <a href="#">${actor.original_name}</a>
        </h4>
      </div>
    </div>`;
}

// Create HTML for one season
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
        <p><strong>Ngày phát sóng:</strong> ${season.air_date || "N/A"}</p>
        <p><strong>Số tập:</strong> ${season.episode_count || "N/A"}</p>
        <p><strong>Giới thiệu:</strong> ${season.overview || "N/A"}</p>
      </div>
    </div>
  `;
}

// Render sections
function renderActors(actors) {
  const actorContainer = document.querySelector("#actors .actors");
  const viewMoreBtn = document.querySelector("#actors .tab-panel__more");

  if (!actorContainer) {
    console.error("Không tìm thấy .actors container");
    return;
  }

  actorContainer.innerHTML = "";

  if (!actors.length) {
    actorContainer.innerHTML = "<p>Không có thông tin diễn viên.</p>";
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    return;
  }

  // Store all actors in data attribute
  actorContainer.dataset.allActors = JSON.stringify(actors);

  // Show first 5 actors
  const actorsToShow = actors.slice(0, 5);

  actorsToShow.forEach((actor) => {
    actorContainer.insertAdjacentHTML("beforeend", createActorHTML(actor));
  });

  // Hide "View more" button if 5 or fewer actors
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
  const infoGrid = document.querySelector("#info .tab-panel--info");

  if (!infoGrid) {
    console.error("Không tìm thấy .tab-panel--info container");
    return;
  }
  const firstAirDate = new Date(tv.first_air_date);

  infoGrid.innerHTML = `
      <h3 class="tab-panel__title">Thông tin phim</h3>
      <div class="info-item">
        <div class="info-item__label">Số mùa:</div>
        <div class="info-item__value">${tv.number_of_seasons || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-item__label">Tổng số tập:</div>
        <div class="info-item__value">${tv.number_of_episodes || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-item__label">Quốc gia:</div>
        <div class="info-item__value">${
          tv.production_countries?.[0]?.iso_3166_1
            ? `<img src="https://flagcdn.com/48x36/${tv.production_countries[0].iso_3166_1.toLowerCase()}.png" 
                  alt="${tv.production_countries[0].name}" 
                  style="width: 32px; height: 24px; vertical-align: middle;">`
            : "Không rõ"
        }</div>
      </div>
      <div class="info-item">
        <div class="info-item__label">Trạng thái:</div>
        <div class="info-item__value">${tv.status || "Không rõ"}</div>
      </div>
      <div class="info-item">
        <div class="info-item__label">Ngày ra mắt:</div>
        <div class="info-item__value">${
          firstAirDate.toLocaleDateString("vi-VN") || "N/A"
        }</div>
      </div>
      </div>
    `;
  console.log(tv);
}

function renderSeasons(seasons) {
  const container = document.querySelector("#seasons .seasons");
  const viewMoreBtn = document.getElementById("season-view-more");

  if (!container) {
    console.error("Không tìm thấy .seasons container");
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

  // Store all seasons in data attribute
  container.dataset.allSeasons = JSON.stringify(validSeasons);
  // Show first 3 seasons
  const seasonsToShow = validSeasons.slice(0, 3);

  seasonsToShow.forEach((season) => {
    container.insertAdjacentHTML("beforeend", createSeasonHTML(season));
  });

  // Hide "View more" button if 3 or fewer seasons
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
  const container = document.querySelector("#producers .producers");

  if (!container) {
    console.error("Không tìm thấy .producers container");
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
        `<div class="producer">
            <img class="producer__logo" src="${logo}" alt="${company.name}" title="${company.name}" />
          </div>`
      );
    } else {
      container.insertAdjacentHTML(
        "beforeend",
        `<div class="producer">
            <p class="producer__name"><strong>${company.name}</strong></p>
          </div>`
      );
    }
  });
}

// Recommended TV Shows
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

// Tab switching
function initTabs() {
  const tabs = document.querySelectorAll(".tabs__btn");
  const tabContents = document.querySelectorAll(".tabs__content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = this.getAttribute("data-tab");

      // Remove active from all tabs and contents
      tabs.forEach((t) => t.classList.remove("tabs__btn--active"));
      tabContents.forEach((content) =>
        content.classList.remove("tabs__content--active")
      );

      // Add active to selected tab
      this.classList.add("tabs__btn--active");

      // Add active to corresponding content
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add("tabs__content--active");
      }
    });
  });
}

// View more (actors & seasons)
function initViewMore(buttonSelector, contentSelector) {
  const viewMoreBtn = document.querySelector(buttonSelector);
  const content = document.querySelector(contentSelector);

  if (!viewMoreBtn || !content) return;

  viewMoreBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const isExpanded = content.classList.contains("expanded");

    // Check content type (actors or seasons)
    const isActorSection = content.classList.contains("actors");
    const isSeasonSection = content.classList.contains("seasons");

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

      // Scroll to top of section
      const parentSection = content.closest(".tab-panel");
      if (parentSection) {
        parentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Expand
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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const tvId = new URLSearchParams(window.location.search).get("id") || 2382;

  fetchTvDetails(tvId);
  loadRecommendedTvShows(tvId);
  initTabs();
  initViewMore("#actors .tab-panel__more", "#actors .actors");
  initViewMore("#season-view-more", "#seasons .seasons");
});
