import { TMDB_API_KEY } from "../../config.js";

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w300";

const params = new URLSearchParams(window.location.search);
const personId = params.get("id");

const personImage = document.getElementById("person-image");
const personName = document.getElementById("person-name");
const alsoKnownAs = document.getElementById("also-known-as");
const biography = document.getElementById("biography");
const gender = document.getElementById("gender");
const birthday = document.getElementById("birthday");
const moviesGrid = document.getElementById("movies-grid");

let currentPage = 1;
const perPage = 10;
let allMovies = [];
let movieCardTemplate = "";
let tvCardTemplate = "";

/* LOAD TEMPLATE */
Promise.all([
  fetch("../components/MovieCardRender.html").then((res) => res.text()),
  fetch("../components/TvShowCardRender.html").then((res) => res.text()),
])
  .then(([movieHTML, tvHTML]) => {
    movieCardTemplate = movieHTML;
    tvCardTemplate = tvHTML;
    loadPersonDetail();
    loadPersonMovies();
  })
  .catch((err) => console.error("Không tải được template:", err));

/* PERSON DETAIL */
async function loadPersonDetail() {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    personName.textContent = data.name || "Đang cập nhật";
    alsoKnownAs.textContent = data.also_known_as?.[0] || "Đang cập nhật";
    biography.textContent = data.biography || "Đang cập nhật";

    gender.textContent =
      data.gender === 1 ? "Nữ" : data.gender === 2 ? "Nam" : "Không rõ";

    birthday.textContent = data.birthday || "Đang cập nhật";

    const profile = data.profile_path
      ? `${IMG_URL}${data.profile_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          data.name || "Unknown"
        )}&size=300&background=1a1a2e&color=0891b2`;

    personImage.src = profile;
  } catch (err) {
    console.error(err);
  }
}

/* LOAD MOVIES */
async function loadPersonMovies() {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    allMovies = data.cast.sort((a, b) => b.popularity - a.popularity);

    renderMoviesPage();
  } catch (err) {
    console.error(err);
  }
}

/* RENDER LIST */
function renderMoviesPage() {
  const totalPages = Math.ceil(allMovies.length / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  moviesGrid.innerHTML = "";

  const currentMovies = allMovies.slice(start, end);

  currentMovies.forEach((item) => {
    const template =
      item.media_type === "tv" ? tvCardTemplate : movieCardTemplate;

    const poster = item.poster_path
      ? `${IMG_URL}${item.poster_path}`
      : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

    let cardHTML = template
      .replace(/{{id}}/g, item.id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, item.title || item.name)
      .replace(
        /{{original_title}}/g,
        item.original_title || item.original_name
      );

    moviesGrid.insertAdjacentHTML("beforeend", cardHTML);
  });

  renderPaginationModern(currentPage, totalPages);
}

/* PAGINATION */
function renderPaginationModern(page, total) {
  const old = document.querySelector(".pagination");
  if (old) old.remove();

  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination");

  const prev = document.createElement("button");
  prev.classList.add("pagination__button");
  prev.innerHTML = "&#8592;";
  prev.disabled = page === 1;

  prev.onclick = () => {
    currentPage--;
    renderMoviesPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const info = document.createElement("div");
  info.classList.add("pagination__info");
  info.innerHTML = `
    <span>Trang</span>
    <span class="pagination__current">${page}</span>
    <span>/</span>
    <span>${total}</span>
  `;

  const next = document.createElement("button");
  next.classList.add("pagination__button");
  next.innerHTML = "&#8594;";
  next.disabled = page === total;

  next.onclick = () => {
    currentPage++;
    renderMoviesPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  container.appendChild(prev);
  container.appendChild(info);
  container.appendChild(next);

  moviesGrid.after(container);
}
