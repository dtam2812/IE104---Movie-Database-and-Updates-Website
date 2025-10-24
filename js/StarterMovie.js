import { TMDB_API_KEY } from "../config.js";

const API_KEY = TMDB_API_KEY;
const API_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`;

const slidesEl = document.getElementById("slides");
const brandEl = document.getElementById("brand");
const enEl = document.getElementById("en");
const metaEl = document.getElementById("meta");
const genresEl = document.getElementById("genres");
const descEl = document.getElementById("desc");
const thumbsEl = document.getElementById("thumbs");

let movies = [];
let index = 0;
let timer;

// Tạo slide
function createSlide(movie) {
  const wrap = document.createElement("div");
  wrap.className = "slide";

  const img = document.createElement("img");
  img.src = movie.backgroundImage;
  img.alt = movie.title;
  img.className = "bg";

  const v = document.createElement("div");
  v.className = "overlay-v";
  const h = document.createElement("div");
  h.className = "overlay-h";

  wrap.append(img, v, h);
  return wrap;
}

function renderBackground() {
  slidesEl.innerHTML = "";
  movies.forEach((m, i) => {
    const s = createSlide(m);
    if (i === index) s.classList.add("active");
    slidesEl.appendChild(s);
  });
}

// Tạo thẻ badge
function badge(content, cls) {
  const b = document.createElement("div");
  b.className = "badge" + (cls ? " " + cls : "");
  b.innerHTML = content;
  return b;
}

function renderContent() {
  const m = movies[index];
  brandEl.src = m.posterImage;
  brandEl.alt = m.title;
  enEl.textContent = m.englishTitle || "";

  metaEl.innerHTML = "";
  metaEl.appendChild(badge(`<b>HD</b>`, "grad"));
  metaEl.appendChild(badge(`<b>PG-13</b>`, "white"));
  metaEl.appendChild(
    badge(
      `<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`,
      "outline-yellow"
    )
  );
  metaEl.appendChild(badge(`<span>${m.year}</span>`));
  metaEl.appendChild(badge(`<span>${m.duration}</span>`));

  genresEl.innerHTML = "";
  m.genres
    .slice(0, 4)
    .forEach((g) => genresEl.appendChild(badge(`<span>${g}</span>`)));
  if (m.genres.length > 4)
    genresEl.appendChild(badge(`<span>+${m.genres.length - 4}</span>`));

  descEl.textContent = m.description;
}

// Tạo thumbnail
function renderThumbs() {
  thumbsEl.innerHTML = "";
  movies.forEach((m, i) => {
    const b = document.createElement("button");
    b.className = "thumb";
    b.setAttribute("aria-label", m.title);
    if (i === index) b.classList.add("active");

    const img = document.createElement("img");
    img.src = m.thumbnailImage;
    img.alt = m.title;
    b.appendChild(img);

    b.addEventListener("click", () => {
      index = i;
      update(true);
    });

    thumbsEl.appendChild(b);
  });
}

// Cập nhật giao diện
function update(stopAuto) {
  renderBackground();
  renderContent();
  renderThumbs();

  if (stopAuto) {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
}

function next() {
  index = (index + 1) % movies.length;
  update();
}

// Fetch dữ liệu từ TMDB
async function fetchMovies() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Giới hạn 4 phim đầu tiên
    movies = data.results.slice(0, 6).map((m) => ({
      title: m.title,
      englishTitle: m.original_title,
      backgroundImage: "https://image.tmdb.org/t/p/original" + m.backdrop_path,
      posterImage: "https://image.tmdb.org/t/p/w500" + m.poster_path,
      thumbnailImage: "https://image.tmdb.org/t/p/w200" + m.poster_path,
      imdbRating: (m.vote_average || 0).toFixed(1),
      year: m.release_date ? m.release_date.split("-")[0] : "N/A",
      duration: "2h",
      genres: [],
      description: m.overview,
    }));

    if (movies.length > 0) {
      update();
      timer = setInterval(next, 5000);
    }
  } catch (err) {
    console.error("Fetch TMDB failed:", err);
  }
}

// Khởi tạo
fetchMovies();

export const starterMovie = { update };
