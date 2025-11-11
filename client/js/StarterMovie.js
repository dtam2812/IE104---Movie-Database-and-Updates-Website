import { TMDB_API_KEY } from "../../config.js";

const API_KEY = TMDB_API_KEY;
const API_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=vi-VN`;

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

const IMAGE_BASE = "https://image.tmdb.org/t/p";
const FALLBACK_POSTER = "https://via.placeholder.com/300x450?text=No+Image";

const createEl = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};

const badge = (content, cls) =>
  createEl("div", `badge${cls ? " " + cls : ""}`, content);

function createSlide(movie, isActive) {
  const wrap = createEl("div", `slide${isActive ? " active" : ""}`);
  const img = createEl("img", "bg");
  img.src = movie.backgroundImage;
  img.alt = movie.title;
  wrap.append(img, createEl("div", "overlay-v"), createEl("div", "overlay-h"));
  return wrap;
}

function renderBackground() {
  slidesEl.replaceChildren(
    ...movies.map((m, i) => createSlide(m, i === index))
  );
}

function renderContent() {
  const m = movies[index];
  brandEl.src = m.title;
  brandEl.alt = m.title;
  enEl.textContent = m.englishTitle || "";

  metaEl.innerHTML = "";
  const metaData = [
    badge("<b>HD</b>", "grad"),
    badge("<b>PG-13</b>", "white"),
    badge(
      `<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`,
      "outline-yellow"
    ),
    badge(`<span>${m.year}</span>`),
    badge(`<span>${m.duration}</span>`),
  ];
  metaEl.append(...metaData);

  genresEl.innerHTML = "";
  const formattedGenres = m.genres.map((g) => g.replace(/^Phim\s+/i, ""));
  formattedGenres
    .slice(0, 4)
    .forEach((g) => genresEl.append(badge(`<span>${g}</span>`)));
  if (formattedGenres.length > 4)
    genresEl.append(badge(`<span>+${formattedGenres.length - 4}</span>`));

  descEl.classList.remove("expanded");
  descEl.textContent = m.description;

  const oldToggle = descEl.nextElementSibling;
  if (oldToggle && oldToggle.classList.contains("desc-toggle")) {
    oldToggle.remove();
  }

  if (m.description.length > 200) {
    const toggleBtn = document.createElement("span");
    toggleBtn.className = "desc-toggle";
    toggleBtn.textContent = "Xem thêm";

    toggleBtn.onclick = () => {
      const expanded = descEl.classList.toggle("expanded");
      toggleBtn.textContent = expanded ? "Thu gọn" : "Xem thêm";
    };

    descEl.after(toggleBtn);
  }
}

function renderThumbs() {
  thumbsEl.replaceChildren(
    ...movies.map((m, i) => {
      const b = createEl("button", `thumb${i === index ? " active" : ""}`);
      b.ariaLabel = m.title;
      const img = createEl("img");
      img.src = m.thumbnailImage;
      img.alt = m.title;
      b.append(img);
      b.onclick = () => {
        index = i;
        update(true);
      };
      return b;
    })
  );
}

function update(stopAuto = false) {
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

async function fetchMovies() {
  try {
    const res = await fetch(API_URL);
    const { results } = await res.json();
    const basicMovies = results?.slice(0, 6) || [];

    const movieDetails = await Promise.all(
      basicMovies.map(async (m) => {
        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/movie/${m.id}?api_key=${API_KEY}&language=vi-VN`
          );
          const detail = await detailRes.json();

          return {
            title: m.title || m.original_title || "Không có tiêu đề",
            englishTitle: m.original_title || "",
            backgroundImage: m.backdrop_path
              ? `${IMAGE_BASE}/original${m.backdrop_path}`
              : FALLBACK_POSTER,
            thumbnailImage: m.poster_path
              ? `${IMAGE_BASE}/w300${m.poster_path}`
              : FALLBACK_POSTER,
            imdbRating: (m.vote_average || 0).toFixed(1),
            year: m.release_date?.split("-")[0] || "N/A",
            duration: detail.runtime ? `${detail.runtime} phút` : "N/A",
            genres: detail.genres?.map((g) => g.name) || [],
            description: m.overview || "Không có mô tả.",
          };
        } catch (err) {
          console.warn(`Lỗi chi tiết phim ${m.id}:`, err);
          return null;
        }
      })
    );

    movies = movieDetails.filter(Boolean);

    if (movies.length > 0) {
      update();
      timer = setInterval(next, 5000);
    } else {
      console.warn("Không có phim để hiển thị.");
    }
  } catch (err) {
    console.error("Fetch TMDB failed:", err);
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite");
  if (!btn) return;
  btn.classList.toggle("active");
});

fetchMovies();

export const starterMovie = { update };
