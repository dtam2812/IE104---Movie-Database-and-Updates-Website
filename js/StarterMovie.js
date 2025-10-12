import movies from "../data/movies.js";

const slidesEl = document.getElementById("slides");
const brandEl = document.getElementById("brand");
const enEl = document.getElementById("en");
const metaEl = document.getElementById("meta");
const genresEl = document.getElementById("genres");
const descEl = document.getElementById("desc");
const thumbsEl = document.getElementById("thumbs");

let index = 0;
let timer;

function createSlide(movie) {
  const wrap = document.createElement("div");
  wrap.className = "slide";
  const img = document.createElement("img");
  img.src = movie.backgroundImage;
  img.alt = "";
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
  if (m.quality) metaEl.appendChild(badge(`<b>${m.quality}</b>`, "grad"));
  metaEl.appendChild(badge(`<b>${m.ageRating}</b>`, "white"));
  if (typeof m.imdbRating === "number")
    metaEl.appendChild(
      badge(
        `<span class="imdb">IMDb</span><span>${m.imdbRating}</span>`,
        "outline-yellow"
      )
    );
  metaEl.appendChild(badge(`<span>${m.year}</span>`));
  if (m.season) metaEl.appendChild(badge(`<span>${m.season}</span>`));
  metaEl.appendChild(badge(`<span>${m.duration}</span>`));

  genresEl.innerHTML = "";
  m.genres
    .slice(0, 4)
    .forEach((g) => genresEl.appendChild(badge(`<span>${g}</span>`)));
  if (m.genres.length > 4)
    genresEl.appendChild(badge(`<span>+${m.genres.length - 4}</span>`));

  descEl.textContent = m.description;
}

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

// Init
renderBackground();
renderContent();
renderThumbs();
timer = setInterval(next, 5000);

// Expose next() for testing
export const starterMovie = { update };
