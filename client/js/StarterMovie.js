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

const trailerModal = document.getElementById("trailer-modal");
const trailerFrame = document.getElementById("trailer-frame");
const closeTrailer = document.getElementById("close-trailer");
const trailerBtn = document.getElementById("trailer-btn");
const infoBtn = document.querySelector("button[aria-label='Info']");

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

//Tạo slide
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

//  Nội dung slide
function renderContent() {
  const m = movies[index];
  if (!m) return;

  brandEl.src = m.title;
  brandEl.alt = m.title;
  enEl.textContent = m.englishTitle || "";

  // Meta
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

  // Genres
  genresEl.innerHTML = "";
  const formattedGenres = m.genres.map((g) => g.replace(/^Phim\s+/i, ""));
  formattedGenres
    .slice(0, 4)
    .forEach((g) => genresEl.append(badge(`<span>${g}</span>`)));
  if (formattedGenres.length > 4)
    genresEl.append(badge(`<span>+${formattedGenres.length - 4}</span>`));

  // Description
  descEl.classList.remove("expanded");
  descEl.textContent = m.description;
  const oldToggle = descEl.nextElementSibling;
  if (oldToggle && oldToggle.classList.contains("desc-toggle"))
    oldToggle.remove();

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

//  Thumbnails
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

// Cập nhật carousel
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

// Lấy danh sách phim
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
            id: m.id, // thêm ID để lấy trailer
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

//  Trailer
async function getTrailerKey(movieId, type = "movie") {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const trailer = data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );
    const teaser = data.results.find(
      (v) => v.type === "Teaser" && v.site === "YouTube"
    );
    const fallback = data.results.find((v) => v.site === "YouTube");

    return (trailer || teaser || fallback)?.key || null;
  } catch (err) {
    console.error("Lỗi lấy trailer:", err);
    return null;
  }
}

trailerBtn.addEventListener("click", async () => {
  const currentMovie = movies[index];
  if (!currentMovie) return;

  const key = await getTrailerKey(currentMovie.id);
  if (!key) {
    alert("Xin lỗi, không tìm thấy trailer cho phim này.");
    return;
  }

  trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
  trailerModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

function closeModal() {
  trailerModal.style.display = "none";
  trailerFrame.src = "";
  document.body.style.overflow = "";
}

closeTrailer.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === trailerModal) closeModal();
});

// Favorite
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite");
  if (!btn) return;
  btn.classList.toggle("active");
});

//  Info Button
infoBtn.addEventListener("click", () => {
  const currentMovie = movies[index];
  if (!currentMovie) return;
  window.location.href = `../pages/MovieDetail.html?id=${currentMovie.id}`;
});

//  Khởi tạo
fetchMovies();

export const starterMovie = { update };
