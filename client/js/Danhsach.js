import { TMDB_API_KEY } from "../../config.js";

// General configuration
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w300";
const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";
let LANGUAGE = getLang();

// Save current filter information
let currentPage = 1;
let currentMovieType = "all";
let currentCountry = "";
let currentGenre = [];
let currentArrange = "new";
let totalPages = 100;

// Template Card for movie and tvShows
let movieCardTemplate = "";
let tvShowCardTemplate = "";

// Genres only for movies and tv shows
const movieOnlyGenres = [
  "28",
  "12",
  "14",
  "36",
  "27",
  "10402",
  "10749",
  "878",
  "53",
  "10752",
];
const tvOnlyGenres = [
  "10759",
  "10762",
  "10763",
  "10764",
  "10765",
  "10766",
  "10767",
  "10768",
];

// Declare commonly used DOM elements

// DOM elements inside the filter
const filterToggle = document.querySelector(".filter__toggle"); 
const filterSelect = document.querySelector(".filter__select"); 
const faFilter = document.querySelector(".fa-solid.fa-filter"); 
const filterCloseBtn = document.querySelector(".filter__close-btn"); 
const filterBtn = document.querySelector(".filter__select-btn"); 

const selectListItemCountry = document.querySelectorAll(
  ".filter__select-list.country .filter__select-list-item"
); // List of items in the "Country" section
const selectListItemCountryAll = document.querySelector(
  ".filter__select-list.country .all"
); // "All" item in the "Country" section
const itemMovieType = document.querySelectorAll(
  ".filter__select-list.movie-type .filter__select-list-item"
); // List of items in the "Movie Type" section
const itemMovieGenre = document.querySelectorAll(
  ".filter__select-list.movie-genre .filter__select-list-item"
); // List of items in the "Genre" section
const itemMovieGenreAll = document.querySelector(
  ".filter__select-list.movie-genre .all"
); // "All" item in the "Genre" section
const itemArrange = document.querySelectorAll(
  ".filter__select-list.arrange .filter__select-list-item"
); // List of items in the "Arrange" section

// DOM elements for movie container and pagination
const movieContainer = document.querySelector(".movie"); // Movie container
const pageCurrentSpan = document.querySelector(".pagination-page-current"); // Current page number
const pageTotalSpan = document.querySelector(
  ".pagination__main span:last-child"
); // Total number of pages
const leftPag = document.querySelector(".pagination-left-arrow"); // Previous page button
const rightPag = document.querySelector(".pagination-right-arrow"); // Next page button

// Toggle filter visibility
filterToggle.addEventListener("click", () => {
  filterSelect.classList.toggle("hidden");
  faFilter.classList.toggle("fa-filter-active");
});

// Close filter toggle when clicking the "Filter results" button
filterCloseBtn.addEventListener("click", () => {
  filterSelect.classList.add("hidden");
  faFilter.classList.remove("fa-filter-active");
});

function getLang() {
  const lang =
    localStorage.getItem("language") || document.documentElement.lang || "vi";
  return lang === "vi" ? "vi-VN" : "en-US";
}

// Active 1 item only in the "Country" section
selectListItemCountry.forEach((current) => {
  current.addEventListener("click", () => {
    const currentActive = document.querySelector(
      ".filter__select-list.country .filter__select--active"
    );
    if (currentActive) {
      currentActive.classList.remove("filter__select--active");
    }
    current.classList.add("filter__select--active");
  });
});

// Function to update "Genre" items visibility based on the selected "Movie Type"
function updateGenreVisibility(type) {
  const allGenreItems = document.querySelectorAll(
    ".filter__select-list.movie-genre .filter__select-list-item"
  );

  allGenreItems.forEach((item) => {
    const genreId = item.getAttribute("data-genre");

    if (genreId === "all") return;

    // If "Movie Type" is movie, hide items only available for TV shows; if TV, hide items only available for movies; if all, show all
    if (type === "movie") {
      if (tvOnlyGenres.includes(genreId)) {
        item.classList.add("hidden");
        item.classList.remove("filter__select--active");
      } else {
        item.classList.remove("hidden");
      }
    } else if (type === "tv") {
      if (movieOnlyGenres.includes(genreId)) {
        item.classList.add("hidden");
        item.classList.remove("filter__select--active");
      } else {
        item.classList.remove("hidden");
      }
    } else {
      item.classList.remove("hidden");
    }
  });

  checkGenreLastActive();
}

// Function to activate the "All" item if no other item is active in the "Genre" section
function checkGenreLastActive() {
  const lastActive = document.querySelector(
    ".filter__select-list.movie-genre .filter__select--active"
  );

  if (!lastActive) {
    itemMovieGenreAll.classList.add("filter__select--active");
  }
}

// Active 1 item only in the "Movie Type" section
itemMovieType.forEach((current) => {
  current.addEventListener("click", () => {
    const itemMovieTypeActive = document.querySelector(
      ".filter__select-list.movie-type .filter__select--active"
    );

    if (current !== itemMovieTypeActive) {
      current.classList.add("filter__select--active");
      itemMovieTypeActive.classList.remove("filter__select--active");

      const selectedType = current.getAttribute("data-type");
      updateGenreVisibility(selectedType);
    }
  });
});

// Active "All" item will remove active from other items in the "Genre" section
itemMovieGenreAll.addEventListener("click", () => {
  itemMovieGenre.forEach((current) => {
    current.classList.remove("filter__select--active");
  });
  itemMovieGenreAll.classList.add("filter__select--active");
});

// Allow multiple items to be active except the "All" item in the "Genre" section
itemMovieGenre.forEach((current) => {
  current.addEventListener("click", () => {
    itemMovieGenreAll.classList.remove("filter__select--active");
    current.classList.toggle("filter__select--active");

    checkGenreLastActive();
  });
});

// Active 1 item only in the "Arrange" section
itemArrange.forEach((current) => {
  current.addEventListener("click", () => {
    const itemArrangeActive = document.querySelector(
      ".filter__select-list.arrange .filter__select--active"
    );

    if (itemArrangeActive !== current) {
      current.classList.add("filter__select--active");
      itemArrangeActive.classList.remove("filter__select--active");
    }
  });
});

// Function to get params from URL
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    type: params.get("type"),
    genre: params.get("genre"),
    country: params.get("country"),
  };
}

// Reset all filter items to default
function resetFiltersToDefault() {
  // Active item "All" in the "Country" section
  selectListItemCountry.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  selectListItemCountryAll.classList.add("filter__select--active");

  // Active item "All" in the "Movie Type" section
  itemMovieType.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  document
    .querySelector('.filter__select-list.movie-type [data-type="all"]')
    .classList.add("filter__select--active");

  // Active item "All" in the "Genre" section
  itemMovieGenre.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  itemMovieGenreAll.classList.add("filter__select--active");

  // Active item "Newest" in the "Arrange" section
  itemArrange.forEach((item) => {
    item.classList.remove("filter__select--active");
  });
  document
    .querySelector('.filter__select-list.arrange [data-arrange="new"]')
    .classList.add("filter__select--active");

  // Reset filter
  currentMovieType = "all";
  currentCountry = "";
  currentGenre = [];
  currentArrange = "new";
  currentPage = 1;

  updateGenreVisibility("all");
}

// Function to apply params from URL
function applyUrlParams() {
  const params = getUrlParams();

  resetFiltersToDefault();

  // Activate the corresponding "Movie Type" from the URL
  if (params.type) {
    currentMovieType = params.type;

    itemMovieType.forEach((item) => {
      item.classList.remove("filter__select--active");
    });

    const targetType = document.querySelector(
      `.filter__select-list.movie-type [data-type="${params.type}"]`
    );
    if (targetType) {
      targetType.classList.add("filter__select--active");
    }

    updateGenreVisibility(params.type);
  }

  // Activate the corresponding "Genre" from the URL
  if (params.genre) {
    currentGenre = [params.genre];

    itemMovieGenreAll.classList.remove("filter__select--active");

    const targetGenre = document.querySelector(
      `.filter__select-list.movie-genre [data-genre="${params.genre}"]`
    );
    if (targetGenre) {
      targetGenre.classList.add("filter__select--active");
    }
  }

  // Activate the corresponding "Country" from the URL
  if (params.country) {
    currentCountry = params.country;

    selectListItemCountryAll.classList.remove("filter__select--active");

    const targetCountry = document.querySelector(
      `.filter__select-list.country [data-country="${params.country}"]`
    );
    if (targetCountry) {
      targetCountry.classList.add("filter__select--active");
    }
  }
}

// Initialize movie list
async function initApp() {
  try {
    // Load 2 templates for movies and TV shows
    const [movieResponse, tvResponse] = await Promise.all([
      fetch("../components/MovieCardRender.html"),
      fetch("../components/TvShowCardRender.html"),
    ]);

    movieCardTemplate = await movieResponse.text();
    tvShowCardTemplate = await tvResponse.text();

    // If it's the "Filter" section, open the filter toggle
    const params = getUrlParams();
    const isFilterNav =
      params.type === "all" && !params.genre && !params.country;

    if (isFilterNav) {
      filterSelect.classList.remove("hidden");
      faFilter.classList.add("fa-filter-active");
    }

    applyUrlParams();

    await render();
  } catch (error) {
    console.log("Lỗi load template:", error);
  }
}

initApp();

// Render movies according to "Movie Type"
async function render() {
  try {
    if (currentMovieType === "all") {
      await renderBothMovieAndTV();
    } else {
      await renderOneType();
    }
  } catch (error) {
    console.log("Lỗi render:", error);
  }
}

// Render one type, either movie or TV show
async function renderOneType() {
  try {
    const apiUrl = createApiUrl(currentMovieType, currentPage);

    const response = await fetch(apiUrl);
    const data = await response.json();

    const movieList = data.results;
    totalPages = Math.min(data.total_pages, 100);
    updatePageNumber();
    displayMovies(movieList);
  } catch (error) {
    console.log("Lỗi:", error);
    throw error;
  }
}

// Render both movies and TV shows
async function renderBothMovieAndTV() {
  try {
    const movieApiUrl = createApiUrl("movie", currentPage);
    const tvApiUrl = createApiUrl("tv", currentPage);

    const [movieResponse, tvResponse] = await Promise.all([
      fetch(movieApiUrl),
      fetch(tvApiUrl),
    ]);

    const movieData = await movieResponse.json();
    const tvData = await tvResponse.json();

    // Take the first 10 movies of each type and shuffle them using the Fisher-Yates algorithm
    const movie10 = movieData.results.slice(0, 10);
    const tv10 = tvData.results.slice(0, 10);
    let mergeAll = [...movie10, ...tv10];

    // If there is only one type, use all results of that type
    if (movie10.length !== 0 && tv10.length == 0) {
      mergeAll = movieData.results;
    } else if (movie10.length == 0 && tv10.length !== 0) {
      mergeAll = tvData.results;
    } else {
      mergeAll = [];
    }

    for (let i = 0; i < 10; i++) {
      if (movie10[i]) mergeAll.push(movie10[i]);
      if (tv10[i]) mergeAll.push(tv10[i]);
    }

    const maxPages = Math.max(movieData.total_pages, tvData.total_pages);
    totalPages = Math.min(maxPages, 100);

    updatePageNumber();
    displayMovies(mergeAll);
  } catch (error) {
    console.log("Lỗi:", error);
    throw error;
  }
}

// Create API according to user-selected filters
function createApiUrl(type, page) {
  let url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=${LANGUAGE}&page=${page}`;

  if (currentGenre.length > 0) {
    url += `&with_genres=${currentGenre.join(",")}`;
  }

  if (currentCountry) {
    url += `&with_origin_country=${currentCountry}`;
  }

  if (currentArrange === "new") {
    if (type === "movie") {
      url += "&sort_by=release_date.desc";
    } else {
      url += "&sort_by=first_air_date.desc";
    }
  } else if (currentArrange === "imdb") {
    url += "&sort_by=vote_average.desc&vote_count.gte=100";
  } else if (currentArrange === "popular") {
    url += "&sort_by=popularity.desc";
  }

  return url;
}

// Movie-card-render
function displayMovies(movieList) {
  const paginationElement = document.querySelector(".content__pagination");

  // Check if there are no results
  if (!movieList || movieList.length === 0) {
    movieContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #aaa;">
        <div style="font-size: 20px; margin-bottom: 8px;">Không có kết quả</div>
      </div>
    `;
    // Hide pagination
    if (paginationElement) {
      paginationElement.style.display = "none";
    }
    return;
  }

  // Show pagination if there are results
  if (paginationElement) {
    paginationElement.style.display = "flex";
  }

  let html = "";

  for (let i = 0; i < movieList.length; i++) {
    const movie = movieList[i];

    // Determine if it's a movie or a TV show
    const isMovie = movie.title !== undefined;
    const movieId = movie.id;
    const movieName = isMovie
      ? movie.title || movie.original_title
      : movie.name || movie.original_name;
    const originalName = isMovie ? movie.original_title : movie.original_name;

    // Handle poster: Use placeholder if not available
    const posterPath = movie.poster_path
      ? IMAGE_URL + movie.poster_path
      : PLACEHOLDER_IMAGE;

    // Choose the appropriate template
    const template = isMovie ? movieCardTemplate : tvShowCardTemplate;

    // Replace values
    let cardHtml = template
      .replace(/{{id}}/g, movieId)
      .replace(/{{poster}}/g, posterPath)
      .replace(/{{title}}/g, movieName)
      .replace(/{{original_title}}/g, originalName)
      .replace(/{{name}}/g, movieName); // Khung cho phim bộ

    html += cardHtml;
  }

  movieContainer.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Update page number
function updatePageNumber() {
  pageCurrentSpan.textContent = currentPage;
  pageTotalSpan.textContent = totalPages; // Remove "/" because CSS will add it
  updatePaginationButtons();
}

// DOM when the user clicks the "Filter results" button
filterBtn.addEventListener("click", async () => {
  // Filter by selected "Country"
  const selectedCountry = document.querySelector(
    ".filter__select-list.country .filter__select--active"
  );
  const countryCode = selectedCountry.getAttribute("data-country");
  currentCountry = countryCode === "all" ? "" : countryCode;

  // Filter by selected "Movie type"
  const selectedType = document.querySelector(
    ".filter__select-list.movie-type .filter__select--active"
  );
  currentMovieType = selectedType.getAttribute("data-type");

  // Filter by selected "Genre"
  const selectedGenres = document.querySelectorAll(
    ".filter__select-list.movie-genre .filter__select--active"
  );
  currentGenre = [];
  selectedGenres.forEach((item) => {
    const genreId = item.getAttribute("data-genre");
    if (genreId !== "all") {
      currentGenre.push(genreId);
    }
  });

  // Filter by selected "Arrange"
  const selectedArrange = document.querySelector(
    ".filter__select-list.arrange .filter__select--active"
  );
  currentArrange = selectedArrange.getAttribute("data-arrange");

  // Reset to page 1
  currentPage = 1;
  pageCurrentSpan.textContent = "1";

  // Close filter
  filterSelect.classList.add("hidden");
  faFilter.classList.remove("fa-filter-active");

  await render();
});

// Check if the left and right buttons are clickable
function updatePaginationButtons() {
  if (currentPage <= 1) {
    leftPag.classList.add("disable");
  } else {
    leftPag.classList.remove("disable");
  }

  if (currentPage >= totalPages) {
    rightPag.classList.add("disable");
  } else {
    rightPag.classList.remove("disable");
  }
}

// Click the button to go to the next page
rightPag.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});

// Click the button to go to the previous page
leftPag.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    pageCurrentSpan.textContent = currentPage;
    await render();
  }
});

// When the language is changed from Translate.js
window.addEventListener("languagechange", (e) => {
  LANGUAGE = getLang(); // update TMDB API language
  currentPage = 1; // reset to page 1
  render();
});
