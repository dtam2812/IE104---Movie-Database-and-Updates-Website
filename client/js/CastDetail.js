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

// load template
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

// Load diễn viên
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

    // Gán dữ liệu
    personName.textContent = data.name || "Đang cập nhật";
    alsoKnownAs.textContent = data.also_known_as[0] || "Đang cập nhật";
    biography.textContent = data.biography || "Đang cập nhật";
    gender.textContent =
      data.gender === 1 ? "Nữ" : data.gender === 2 ? "Nam" : "Không rõ";
    birthday.textContent = data.birthday || "Đang cập nhật";

    // cast card
    const profile = data.profile_path
      ? `${IMG_URL}${data.profile_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          data.name || "Unknown"
        )}&size=300&background=1a1a2e&color=0891b2`;

    personImage.src = profile;
    personImage.onerror = () => {
      personImage.src =
        "https://ui-avatars.com/api/?name=Unknown&size=300&background=1a1a2e&color=0891b2";
    };
  } catch (err) {
    console.error("Lỗi khi tải chi tiết diễn viên:", err);
  }
}

// Load danh sách
async function loadPersonMovies() {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=vi-VN`
    );
    const data = await res.json();

    if (!data || !data.cast) {
      moviesGrid.innerHTML = "<p>Không có dữ liệu được tìm thấy.</p>";
      return;
    }

    // Sắp xếp giảm dần theo độ phổ biến
    allMovies = data.cast.sort((a, b) => b.popularity - a.popularity);
    renderMoviesPage();
  } catch (err) {
    console.error("Lỗi khi tải danh sách phim:", err);
  }
}

// render danh sách
function renderMoviesPage() {
  if (!movieCardTemplate || !tvCardTemplate) return;

  moviesGrid.innerHTML = "";
  const totalPages = Math.ceil(allMovies.length / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const currentMovies = allMovies.slice(start, end);

  if (currentMovies.length === 0) {
    moviesGrid.innerHTML = "<p>Không có kết quả.</p>";
    return;
  }

  currentMovies.forEach((item) => {
    // Fallback ảnh
    const poster = item.poster_path
      ? `${IMG_URL}${item.poster_path}`
      : "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster";

    const title = item.title || item.name || "Không rõ";
    const original_title = item.original_title || item.original_name || "";

    // Chọn template (phim hoặc TV show)
    let template =
      item.media_type === "tv" ? tvCardTemplate : movieCardTemplate;

    let cardHTML = template
      .replace(/{{id}}/g, item.id)
      .replace(/{{poster}}/g, poster)
      .replace(/{{title}}/g, title)
      .replace(/{{original_title}}/g, original_title);

    moviesGrid.insertAdjacentHTML("beforeend", cardHTML);
  });

  // fallback ảnh lỗi
  moviesGrid.querySelectorAll("img").forEach((img) => {
    img.onerror = () =>
      (img.src = "https://placehold.co/300x450/1a1a2e/0891b2?text=No+Poster");
  });

  renderPaginationModern(currentPage, totalPages);
}

//pagination
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

  // Thông tin trang
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
