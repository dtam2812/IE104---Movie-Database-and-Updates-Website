import { TMDB_API_KEY } from "../config.js";

export function searchBar() {
  const input = document.querySelector(".search-input");
  const dropdown = document.querySelector(".search-dropdown");
  let timer;

  input.addEventListener("input", () => {
    const query = input.value.trim();

    // Xóa timer để tránh gọi API quá nhiều
    clearTimeout(timer);

    if (query.length === 0) {
      dropdown.style.display = "none";
      dropdown.innerHTML = "";
      return;
    }

    // Delay 400ms để tránh spam API
    timer = setTimeout(async () => {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      showResults(data.results);
    }, 400);
  });

  function showResults(results) {
    dropdown.innerHTML = "";

    if (!results || results.length === 0) {
      dropdown.style.display = "none";
      return;
    }

    results.slice(0, 8).forEach((item) => {
      const li = document.createElement("li");

      if (item.media_type === "movie") {
        li.textContent = `🎬 ${item.title || item.name}`;
      } else if (item.media_type === "person") {
        li.textContent = `⭐ ${item.name}`;
      } else if (item.media_type === "tv") {
        li.textContent = `📺 ${item.name}`;
      }

      li.addEventListener("click", () => {
        input.value = item.title || item.name;
        dropdown.style.display = "none";
        console.log("Selected:", item);
      });

      dropdown.appendChild(li);
    });

    dropdown.style.display = "block";
  }

  // Ẩn dropdown khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      dropdown.style.display = "none";
    }
  });
}
