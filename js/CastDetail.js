import { TMDB_API_KEY } from "../config.js";

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

/* ----------------------------- Load template ----------------------------- */
fetch("../components/MovieCardRender.html")
  .then((res) => res.text())
  .then((html) => {
    movieCardTemplate = html;
    loadPersonDetail();
    loadPersonMovies();
  })
  .catch((err) => console.error("Không tải được MovieCardRender:", err));

/* ----------------------------- Chi tiết diễn viên ----------------------------- */
async function loadPersonDetail() {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    if (!data || data.success === false) {
      personName.textContent = "Không tìm thấy diễn viên";
      return;
    }

    console.log("Thông tin diễn viên:", data);

    personName.textContent = data.name || "Đang cập nhật";
    alsoKnownAs.textContent = data.also_known_as[0] || "Đang cập nhật";
    biography.textContent = data.biography || "Đang cập nhật";
    gender.textContent =
      data.gender === 1 ? "Nữ" : data.gender === 2 ? "Nam" : "Không rõ";
    birthday.textContent = data.birthday || "Đang cập nhật";

    // --- Ảnh diễn viên ---
    if (data.profile_path) {
      personImage.src = `${IMG_URL}${data.profile_path}`;
    } else {
      personImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        data.name || "Unknown"
      )}&size=300&background=1a1a2e&color=0891b2`;
    }

    // fallback nếu lỗi
    personImage.onerror = () => {
      personImage.src = "../assets/image/default-avatar.jpg";
    };
  } catch (err) {
    console.error("Lỗi khi tải chi tiết diễn viên:", err);
  }
}

/* ----------------------------- Danh sách phim ----------------------------- */
async function loadPersonMovies() {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    if (!data || !data.cast) {
      moviesGrid.innerHTML = "<p>Không có phim nào được tìm thấy.</p>";
      return;
    }

    // Sắp xếp theo độ phổ biến giảm dần
    allMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
    renderMoviesPage();
  } catch (err) {
    console.error("Lỗi khi tải danh sách phim:", err);
  }
}

/* ----------------------------- Render phim ----------------------------- */
function renderMoviesPage() {
  if (!movieCardTemplate) return;

  moviesGrid.innerHTML = "";
  const totalPages = Math.ceil(allMovies.length / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const currentMovies = allMovies.slice(start, end);

  if (currentMovies.length === 0) {
    moviesGrid.innerHTML = "<p>Không có phim nào được tìm thấy.</p>";
    return;
  }

  currentMovies.forEach((movie) => {
    // --- Ảnh poster ---
    const poster = movie.poster_path
      ? `${IMG_URL}${movie.poster_path}`
      : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

    const title = movie.title || movie.name || "Không rõ";
    const original_title = movie.original_title || movie.original_name || "";

    let cardHTML = movieCardTemplate
      .replace(/{{id}}/g, movie.id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original_title);

    moviesGrid.insertAdjacentHTML("beforeend", cardHTML);
  });

  // fallback nếu ảnh lỗi
  moviesGrid.querySelectorAll("img").forEach((img) => {
    img.onerror = () =>
      (img.src = "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster");
  });

  renderPaginationModern(currentPage, totalPages);
}

/* ----------------------------- Phân trang hiện đại ----------------------------- */
function renderPaginationModern(page, total) {
  const oldPagination = document.querySelector(".pagination-modern");
  if (oldPagination) oldPagination.remove();

  if (total <= 1) return;

  const container = document.createElement("div");
  container.classList.add("pagination-modern");

  // Nút Prev
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

  // Hộp thông tin trang
  const pageBox = document.createElement("div");
  pageBox.classList.add("page-info-box");
  pageBox.innerHTML = `
    <span class="page-text">Trang</span>
    <span class="page-current">${page}</span>
    <span class="page-divider">/</span>
    <span class="page-total">${total}</span>
  `;

  // Nút Next
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
