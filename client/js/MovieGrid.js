import { TMDB_API_KEY } from "../../config.js";

let movieCardTemplate = "";
let tvCardTemplate = "";

//  Function to get language
function getLang() {
  return (
    localStorage.getItem("language") || document.documentElement.lang || "vi"
  );
}

//Load 2 template HTML (Movie & TV)
Promise.all([
  fetch("../components/MovieCardRender.html").then((r) => r.text()),
  fetch("../components/TvShowCardRender.html").then((r) => r.text()),
])
  .then(([movieHtml, tvHtml]) => {
    movieCardTemplate = movieHtml;
    tvCardTemplate = tvHtml;
    loadMovieGrids(); // Start rendering when templates are loaded
  })
  .catch((err) => console.error("Không tải được template:", err));

//  createCard()
function createCard(item, type) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

  // Handle title according to language
  const titleDisplay =
    type === "tv"
      ? item.name || item.original_name
      : item.title || item.original_title;
  const originalTitle =
    type === "tv" ? item.original_name : item.original_title;

  // Choose the corresponding template (movie or tv)
  const template = type === "tv" ? tvCardTemplate : movieCardTemplate;

  // Replace placeholders in the HTML template
  return template
    .replace(/{{id}}/g, item.id)
    .replace(/{{poster}}/g, poster)
    .replace(/{{title}}/g, titleDisplay)
    .replace(/{{original_title}}/g, originalTitle);
}

// Render grid to the interface
function renderGrid(gridId, items = [], type = "movie") {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.warn(`Không tìm thấy grid: #${gridId}`);
    return;
  }

  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = "<p>Không có dữ liệu để hiển thị.</p>";
    return;
  }

  // Show only 12 first items
  const limitedItems = items.slice(0, 12);

  limitedItems.forEach((item) => {
    const cardHTML = createCard(item, type);
    grid.insertAdjacentHTML("beforeend", cardHTML);
  });
}

//Fetch data from TMDB
async function fetchTMDB(endpoint) {
  try {
    //  Get dynamic language
    const lang = getLang();
    const tmdbLang = lang === "vi" ? "vi-VN" : "en-US";

    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=${tmdbLang}&page=1`
    );
    const data = await res.json();

    if (!data.results) {
      console.warn("Không có dữ liệu trả về từ TMDB:", endpoint);
      return [];
    }

    return data.results;
  } catch (err) {
    console.error("Lỗi khi fetch TMDB:", err);
    return [];
  }
}

//Load all movie/TV grids
async function loadMovieGrids() {
  try {
    const [newMovies, trendingSeries, highRated, popularTV] = await Promise.all(
      [
        fetchTMDB("movie/now_playing"), // New movies in theaters
        fetchTMDB("trending/tv/week"), // Trending TV series
        fetchTMDB("movie/top_rated"), // Highly rated movies
        fetchTMDB("tv/popular"), // Popular TV shows
      ]
    );

    renderGrid("movieGridNew", newMovies, "movie");
    renderGrid("movieGridHot", trendingSeries, "tv");
    renderGrid("movieGridHighRate", highRated, "movie");
    renderGrid("movieGridHotHit", popularTV, "tv");
  } catch (error) {
    console.error("Lỗi khi load grids:", error);
  }
}

// Listen for language change event
window.addEventListener("languagechange", () => {
  loadMovieGrids();
});

// Export for other modules to use
export const movieGrid = { renderGrid, createCard, loadMovieGrids };
