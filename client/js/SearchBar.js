import { TMDB_API_KEY } from "../../config.js";

export function searchBar() {
  const input = document.querySelector(".search-input");
  const dropdown = document.querySelector(".search-dropdown");
  let timer;

  async function fetchResults(query) {
    const [movieRes, tvRes, personRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
          query
        )}&page=1`
      ),
      fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
          query
        )}&page=1`
      ),
      fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(
          query
        )}&page=1`
      ),
    ]);

    const [movies, tvs, persons] = await Promise.all([
      movieRes.json(),
      tvRes.json(),
      personRes.json(),
    ]);

    const moviesData = (movies.results || []).map((i) => ({
      ...i,
      media_type: "movie",
    }));
    const tvsData = (tvs.results || []).map((i) => ({
      ...i,
      media_type: "tv",
    }));
    const personsData = (persons.results || []).map((i) => ({
      ...i,
      media_type: "person",
    }));

    return [...moviesData, ...tvsData, ...personsData].sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(timer);

    if (!query) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("active");
      return;
    }

    timer = setTimeout(async () => {
      try {
        const results = await fetchResults(query);
        renderResults(results.slice(0, 10));
      } catch (e) {
        console.error(e);
      }
    }, 400);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = input.value.trim();
      if (query)
        window.location.href = `/client/view/pages/SearchPage.html?query=${encodeURIComponent(
          query
        )}`;
    }
  });

  function renderResults(results) {
    dropdown.innerHTML = "";
    if (!results.length) return dropdown.classList.remove("active");
    dropdown.classList.add("active");

    results.forEach((item) => {
      if (!(item.poster_path || item.profile_path)) return;
      const card = document.createElement("div");
      card.classList.add("result-item");

      const img =
        item.poster_path || item.profile_path
          ? `https://image.tmdb.org/t/p/w185${
              item.poster_path || item.profile_path
            }`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              item.name || item.title
            )}&size=185`;

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

      card.innerHTML = `<img src="${img}" alt="${title}"><div class="result-info"><div class="result-title">${title}</div>${
        original && original !== title
          ? `<div class="result-subtitle">${original}</div>`
          : ""
      }<div class="result-meta">${type}</div></div>`;

      card.addEventListener("click", () => {
        dropdown.classList.remove("active");
        if (item.media_type === "movie")
          window.location.href = `/client/view/pages/MovieDetail.html?id=${item.id}`;
        else if (item.media_type === "tv")
          window.location.href = `/client/view/pages/TvShowDetail.html?id=${item.id}`;
        else if (item.media_type === "person")
          window.location.href = `/client/view/pages/CastDetail.html?id=${item.id}`;
      });

      dropdown.appendChild(card);
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) dropdown.classList.remove("active");
  });
}
