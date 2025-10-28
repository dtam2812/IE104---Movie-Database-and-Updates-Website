import { TMDB_API_KEY } from "../config.js";

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

// Load cả hai template
Promise.all([
  fetch("../components/MovieCardRender.html").then((res) => res.text()),
  fetch("../components/TvShowCardRender.html").then((res) => res.text()),
])
  .then(([movieHtml, tvHtml]) => {
    movieCardTemplate = movieHtml;
    tvCardTemplate = tvHtml;
    loadPersonDetail();
    loadPersonMovies();
  })
  .catch((err) => console.error("Không tải được template:", err));

// Lấy chi tiết diễn viên
async function loadPersonDetail() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    if (!data || data.success === false) {
      personName.textContent = "Không tìm thấy diễn viên";
      return;
    }

    personName.textContent = data.name || "Đang cập nhật";
    alsoKnownAs.textContent = data.also_known_as[0] || "Đang cập nhật";
    biography.textContent = data.biography || "Đang cập nhật";
    gender.textContent =
      data.gender === 1 ? "Nữ" : data.gender === 2 ? "Nam" : "Không rõ";
    birthday.textContent = data.birthday || "Đang cập nhật";
    personImage.src = data.profile_path
      ? `https://image.tmdb.org/t/p/w300${data.profile_path}`
      : "../assets/image/8f1ca2029e2efceebd22fa05cca423d7.jpg";
  } catch (err) {
    console.error("Lỗi khi tải chi tiết diễn viên:", err);
  }
}

// Lấy danh sách phim + tv show đã tham gia
async function loadPersonMovies() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    if (!data || !data.cast) {
      moviesGrid.innerHTML = "<p>Không có dữ liệu được tìm thấy.</p>";
      return;
    }

    // Sắp xếp theo độ phổ biến
    allMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
    renderMoviesPage();
  } catch (err) {
    console.error("Lỗi khi tải danh sách phim:", err);
  }
}

// Render phim và tv theo trang
function renderMoviesPage() {
  if (!movieCardTemplate || !tvCardTemplate) return;

  moviesGrid.innerHTML = "";
  const totalPages = Math.ceil(allMovies.length / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const currentMovies = allMovies.slice(start, end);

  if (currentMovies.length === 0) {
    moviesGrid.innerHTML = "<p>Không có phim nào được tìm thấy.</p>";
    return;
  }

  currentMovies.forEach((item) => {
    const poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";
    const title = item.title || item.name || "Không rõ";
    const original_title = item.original_title || item.original_name || "";

    // Chọn template phù hợp
    let template =
      item.media_type === "tv" ? tvCardTemplate : movieCardTemplate;

    let cardHTML = template
      .replace(/{{id}}/g, item.id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original_title);

    moviesGrid.insertAdjacentHTML("beforeend", cardHTML);
  });

  renderPaginationModern(currentPage, totalPages);
}

// pagination
function renderPaginationModern(page, total) {
  const oldPagination = document.querySelector(".pagination-modern");
  if (oldPagination) oldPagination.remove();

  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-modern");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-circle");
  prevBtn.innerHTML = "&#8592;";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderMoviesPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  const pageBox = document.createElement("div");
  pageBox.classList.add("page-info-box");
  pageBox.innerHTML = `
    <span class="page-text">Trang</span>
    <span class="page-current">${page}</span>
    <span class="page-divider">/</span>
    <span class="page-total">${total}</span>
  `;

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-circle");
  nextBtn.innerHTML = "&#8594;";
  nextBtn.disabled = page === total;
  nextBtn.addEventListener("click", () => {
    if (currentPage < total) {
      currentPage++;
      renderMoviesPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  container.appendChild(prevBtn);
  container.appendChild(pageBox);
  container.appendChild(nextBtn);

  moviesGrid.after(container);
}
