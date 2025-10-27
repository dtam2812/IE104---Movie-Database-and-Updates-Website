import { TMDB_API_KEY } from "../config.js";

export function searchBar() {
  const input = document.querySelector(".search-input");
  const dropdown = document.querySelector(".search-dropdown");
  let timer;

  // Khi gõ chữ
  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(timer);

    if (query.length === 0) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("active");
      return;
    }

    timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
            query
          )}`
        );
        const data = await res.json();
        renderResults(data.results);
      } catch (err) {
        console.error("TMDB fetch error:", err);
      }
    }, 400);
  });

  // Khi nhấn Enter
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Ngăn reload trang
      const query = input.value.trim();
      if (query.length > 0) {
        window.location.href = `/view/pages/SearchPage.html?query=${encodeURIComponent(
          query
        )}`;
      }
    }
  });

  function renderResults(results) {
    dropdown.innerHTML = "";

    if (!results || results.length === 0) {
      dropdown.classList.remove("active");
      return;
    }

    dropdown.classList.add("active");

    results
      .filter((item) => item.poster_path || item.profile_path)
      .slice(0, 10)
      .forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("result-item");

        const imgSrc = `https://image.tmdb.org/t/p/w185${
          item.poster_path || item.profile_path
        }`;
        const title = item.title || item.name || "Không rõ";
        const original = item.original_title || item.original_name || "";
        const year =
          item.release_date?.split("-")[0] ||
          item.first_air_date?.split("-")[0] ||
          "";
        const type =
          item.media_type === "movie"
            ? `Phim • ${year}`
            : item.media_type === "tv"
            ? `TV Series • ${year}`
            : "Diễn viên";

        card.innerHTML = `
          <img src="${imgSrc}" alt="${title}">
          <div class="result-info">
            <div class="result-title">${title}</div>
            ${
              original && original !== title
                ? `<div class="result-subtitle">${original}</div>`
                : ""
            }
            <div class="result-meta">${type}</div>
          </div>
        `;

        // Chuyển trang khi click
        card.addEventListener("click", () => {
          dropdown.classList.remove("active");
          if (item.media_type === "movie")
            window.location.href = `/view/pages/MovieDetail.html?id=${item.id}`;
          else if (item.media_type === "tv")
            window.location.href = `/view/pages/TvShowDetail.html?id=${item.id}`;
          else if (item.media_type === "person")
            window.location.href = `/view/pages/CastDetail.html?id=${item.id}`;
        });

        dropdown.appendChild(card);
      });
  }

  // Ẩn dropdown khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      dropdown.classList.remove("active");
    }
  });
}
