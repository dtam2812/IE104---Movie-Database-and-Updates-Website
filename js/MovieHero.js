import { TMDB_API_KEY } from "../config.js";

export async function initMovieHero() {
  const movieHeroContainer = document.getElementById("movie-hero");
  if (!movieHeroContainer) return;

  let movies = [];
  let currentIndex = 0;
  let intervalId = null;

  // Lấy danh sách phim từ TMDB =
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`
    );
    const data = await res.json();
    movies = data.results.slice(0, 6); // chỉ lấy 6 phim đầu cho hero
  } catch (err) {
    console.error("Lỗi tải phim từ TMDB:", err);
    movieHeroContainer.innerHTML = "<p>Không thể tải dữ liệu phim.</p>";
    return;
  }

  if (!movies.length) {
    movieHeroContainer.innerHTML = "<p>Không có dữ liệu phim.</p>";
    return;
  }

  //Tạo HTML Hero
  function createMovieHeroHTML() {
    return `
      <div class="movie-hero-container">
        <div class="movie-hero-backgrounds">
          ${movies
            .map(
              (movie, index) => `
            <div class="movie-background ${
              index === currentIndex ? "active" : ""
            }">
              <div class="background-image">
                <img src="https://image.tmdb.org/t/p/original${
                  movie.backdrop_path
                }" alt="${movie.title}" />
                <div class="gradient-overlay-1"></div>
                <div class="gradient-overlay-2"></div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="movie-hero-content">
          <div class="movie-hero-info">
            <div class="movie-poster">
              <img src="https://image.tmdb.org/t/p/w500${
                movies[currentIndex].poster_path
              }" alt="${movies[currentIndex].title}" />
            </div>
            
            <div class="movie-details">
              <div class="movie-english-title">${
                movies[currentIndex].title
              }</div>
              
              <div class="movie-badges">
                <div class="badge imdb-badge">
                  <span class="imdb-label">TMDB</span>
                  <span class="imdb-rating">${movies[
                    currentIndex
                  ].vote_average.toFixed(1)}</span>
                </div>
                <div class="badge year-badge">
                  <span>${movies[currentIndex].release_date.slice(0, 4)}</span>
                </div>
                <div class="badge duration-badge">
                  <span>${movies[
                    currentIndex
                  ].original_language.toUpperCase()}</span>
                </div>
              </div>
              
              <div class="movie-description">
                <p>${movies[currentIndex].overview || "Chưa có mô tả."}</p>
              </div>
              
              <div class="movie-actions">
                <button class="play-button">
                  <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <div class="action-buttons">
                  <button class="action-button heart-button">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <div class="action-divider"></div>
                  <button class="action-button info-button">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="movie-thumbnails">
          <div class="thumbnails-container">
            ${movies
              .map(
                (movie, index) => `
              <button class="thumbnail-button ${
                index === currentIndex ? "active" : ""
              }" data-index="${index}">
                <img src="https://image.tmdb.org/t/p/w200${
                  movie.poster_path
                }" alt="${movie.title}" />
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="hero-gradient-bottom"></div>
      </div>
    `;
  }

  //  Cập nhật slide
  function updateMovieDisplay() {
    const backgrounds =
      movieHeroContainer.querySelectorAll(".movie-background");
    const thumbnails = movieHeroContainer.querySelectorAll(".thumbnail-button");
    const poster = movieHeroContainer.querySelector(".movie-poster img");
    const title = movieHeroContainer.querySelector(".movie-english-title");
    const badges = movieHeroContainer.querySelector(".movie-badges");
    const description = movieHeroContainer.querySelector(
      ".movie-description p"
    );

    const movie = movies[currentIndex];

    backgrounds.forEach((bg, i) =>
      bg.classList.toggle("active", i === currentIndex)
    );
    thumbnails.forEach((t, i) =>
      t.classList.toggle("active", i === currentIndex)
    );

    poster.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    title.textContent = movie.title;
    badges.innerHTML = `
      <div class="badge imdb-badge">
        <span class="imdb-label">TMDB</span>
        <span class="imdb-rating">${movie.vote_average.toFixed(1)}</span>
      </div>
      <div class="badge year-badge"><span>${movie.release_date.slice(
        0,
        4
      )}</span></div>
    `;
    description.textContent = movie.overview || "Chưa có mô tả.";
  }

  // Xử lý auto-rotation
  function startAutoRotation() {
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % movies.length;
      updateMovieDisplay();
    }, 5000);
  }

  function stopAutoRotation() {
    clearInterval(intervalId);
  }

  function handleThumbnailClick(e) {
    const btn = e.target.closest(".thumbnail-button");
    if (!btn) return;
    currentIndex = parseInt(btn.dataset.index);
    updateMovieDisplay();
    stopAutoRotation();
    startAutoRotation();
  }

  // Khởi tạo
  movieHeroContainer.innerHTML = createMovieHeroHTML();
  movieHeroContainer.addEventListener("click", handleThumbnailClick);
  movieHeroContainer.addEventListener("mouseenter", stopAutoRotation);
  movieHeroContainer.addEventListener("mouseleave", startAutoRotation);
  startAutoRotation();
}
