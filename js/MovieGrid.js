import { TMDB_API_KEY } from "../config.js";

function createCard(movie) {
  const card = document.createElement("div");
  card.className = "card";

  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const img = document.createElement("img");
  img.src = movie.poster;
  img.alt = movie.title;
  img.className = "poster";
  img.loading = "lazy";

  const badges = document.createElement("div");
  badges.className = "badges";
  movie.badges.forEach((b) => {
    const badge = document.createElement("div");
    badge.className = `badge badge-${b.type}`;
    badge.textContent = b.text;
    badges.appendChild(badge);
  });

  posterWrap.appendChild(img);
  posterWrap.appendChild(badges);

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = movie.title;

  const subtitle = document.createElement("p");
  subtitle.className = "movie-subtitle";
  subtitle.textContent = movie.subtitle;

  info.appendChild(title);
  info.appendChild(subtitle);

  card.appendChild(posterWrap);
  card.appendChild(info);

  return card;
}

// Hàm render grid
function renderGrid(gridId, movies = []) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.warn(`⚠️ Không tìm thấy grid: #${gridId}`);
    return;
  }
  grid.innerHTML = "";

  if (!movies.length) {
    grid.innerHTML = "<p>Không có phim nào để hiển thị.</p>";
    return;
  }

  movies.forEach((movie) => grid.appendChild(createCard(movie)));
}

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
        : "https://via.placeholder.com/300x450?text=No+Image",
      badges: [{ text: badgeText, type: badgeColor }],
    }));
  } catch (err) {
    console.error("❌ Lỗi khi tải dữ liệu TMDB:", err);
    return [];
  }
}

// Hàm tải toàn bộ grid
async function loadMovieGrids() {
  const [newMovies, trendingSeries, highRated, popularTV] = await Promise.all([
    fetchTMDB("movie/now_playing", "Mới", "gray"),
    fetchTMDB("trending/tv/week", "Series", "blue"),
    fetchTMDB("movie/top_rated", "T.Minh", "green"),
    fetchTMDB("tv/popular", "Đình Đám", "gray"),
  ]);

  renderGrid("movieGridNew", newMovies);
  renderGrid("movieGridHot", trendingSeries);
  renderGrid("movieGridHighRate", highRated);
  renderGrid("movieGridHotHit", popularTV);
}

export const movieGrid = { renderGrid, createCard, loadMovieGrids };
