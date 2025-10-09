import { TMDB_API_KEY } from "../config.js";

async function loadRecommendedMovies(movieId) {
  const container = document.getElementById("recommendations");
  container.innerHTML = ""; // reset nội dung

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`
    );
    const data = await res.json();

    if (!data.results?.length) {
      container.innerHTML = "<p>Không có phim đề xuất.</p>";
      return;
    }

    data.results.slice(0, 12).forEach((movie) => {
      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Image";

      const movieBox = `
        <div class="movie-box">
          <a class="movie-card" href="./movie-details.html?id=${movie.id}">
            <div class="card-info-top">
              <div class="card-info-ep-top"><span>Movie</span></div>
            </div>
            <div>
              <img src="${poster}" alt="${movie.title}">
            </div>
          </a>
          <div class="info">
            <h4 class="vietnam-title">
              <a href="./movie-details.html?id=${movie.id}">${movie.title}</a>
            </h4>
            <h4 class="other-title">
              <a href="#">${movie.original_title}</a>
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

document.addEventListener("DOMContentLoaded", () => {
  const movieId =
    new URLSearchParams(window.location.search).get("id") || 1242404;
  loadRecommendedMovies(movieId);
});
