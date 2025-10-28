import { TMDB_API_KEY } from "../config.js";

// create a movie card element
function createCard(movie) {
  const poster =
    movie.poster || "https://via.placeholder.com/300x450?text=No+Image";
  const originalTitle = movie.subtitle || "Không rõ";
  const badgeText = movie.badges?.[0]?.text || "Movie";

  const div = document.createElement("div");
  div.className = "movie-box";
  

  div.innerHTML = `
    <a class="movie-card" href="./MovieDetail.html?id=${movie.id}">
      <div class="card-info-top">
        <div class="card-info-ep-top">
          <span>${badgeText}</span>
        </div>
      </div>  
      <div>
        <img src="${poster}" alt="${movie.title}">
      </div>
    </a>
    <div class="info">
      <h4 class="vietnam-title">
        <a href="./MovieDetail.html?id=${movie.id}">${movie.title}</a>
      </h4>
      <h4 class="other-title">
        <a href="#">${originalTitle}</a>
      </h4>
    </div>
  `;

  return div;
}

// render a grid of movies into a container
function renderGrid(gridId, movies = []) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.warn(`Không tìm thấy grid: #${gridId}`);
    return;
  }

  grid.innerHTML = "";

  if (!movies.length) {
    grid.innerHTML = "<p>Không có phim nào để hiển thị.</p>";
    return;
  }

  movies.forEach((movie) => grid.appendChild(createCard(movie)));
}

// Load movies from TMDB API
async function fetchTMDB(endpoint, badgeText, badgeColor) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=vi-VN&page=1`
    );
    const data = await res.json();
    if (!data.results?.length) return [];

    return data.results.slice(0, 12).map((m) => ({
      id: m.id,
      title: m.title || m.name,
      subtitle: m.original_title || m.original_name || "",
      poster: m.poster_path
        ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
        : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster",
      badges: [{ text: badgeText, type: badgeColor }],
    }));
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu TMDB:", err);
    return [];
  }
}

// composite function to load all grids
async function loadMovieGrids() {
  const [newMovies, trendingSeries, highRated, popularTV] = await Promise.all([
    fetchTMDB("movie/now_playing", "Movie", "gray"),
    fetchTMDB("trending/tv/week", "TvShow", "blue"),
    fetchTMDB("movie/top_rated", "Movie", "green"),
    fetchTMDB("tv/popular", "TvShow", "gray"),
  ]);

  renderGrid("movieGridNew", newMovies);
  renderGrid("movieGridHot", trendingSeries);
  renderGrid("movieGridHighRate", highRated);
  renderGrid("movieGridHotHit", popularTV);
}

export const movieGrid = { renderGrid, createCard, loadMovieGrids };
