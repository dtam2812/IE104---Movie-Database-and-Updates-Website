import { TMDB_API_KEY } from "../../config.js";

export function searchBar() {
  const input = document.querySelector(".search__input");
  const dropdown = document.querySelector(".search__dropdown");
  let timer;

  // ✅ THÊM: Hàm lấy ngôn ngữ hiện tại
  function getCurrentLanguage() {
    const lang =
      localStorage.getItem("language") || document.documentElement.lang || "vi";
    return lang === "vi" ? "vi-VN" : "en-US";
  }

  // ✅ THÊM: Hàm lấy text dịch
  function getTranslatedText(key) {
    const lang = localStorage.getItem("language") || "vi";
    const translations = {
      vi: {
        unknown: "Không rõ",
        movie: "Phim",
        tvSeries: "TV Series",
        actor: "Diễn viên",
      },
      en: {
        unknown: "Unknown",
        movie: "Movie",
        tvSeries: "TV Series",
        actor: "Actor",
      },
    };
    return translations[lang]?.[key] || translations.vi[key];
  }

  async function fetchResults(query) {
    // ✅ SỬA: Lấy ngôn ngữ động thay vì hard-code "vi-VN"
    const language = getCurrentLanguage();

    const [movieRes, tvRes, personRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=${language}&query=${encodeURIComponent(
          query
        )}&page=1`
      ),
      fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=${language}&query=${encodeURIComponent(
          query
        )}&page=1`
      ),
      fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&language=${language}&query=${encodeURIComponent(
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
      dropdown.classList.remove("search__dropdown--active");
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
    if (!results.length)
      return dropdown.classList.remove("search__dropdown--active");
    dropdown.classList.add("search__dropdown--active");

    results.forEach((item) => {
      if (!(item.poster_path || item.profile_path)) return;
      const card = document.createElement("div");
      card.classList.add("search__result");

      const img =
        item.poster_path || item.profile_path
          ? `https://image.tmdb.org/t/p/w185${
              item.poster_path || item.profile_path
            }`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              item.name || item.title
            )}&size=185`;

      const title = item.title || item.name || getTranslatedText("unknown");
      const original = item.original_title || item.original_name || "";
      const year =
        item.release_date?.split("-")[0] ||
        item.first_air_date?.split("-")[0] ||
        "";

      // ✅ SỬA: Dùng getTranslatedText() cho type
      const type =
        item.media_type === "movie"
          ? `${getTranslatedText("movie")} • ${year}`
          : item.media_type === "tv"
          ? `${getTranslatedText("tvSeries")} • ${year}`
          : getTranslatedText("actor");

      card.innerHTML = `
        <img class="search__result-img" src="${img}" alt="${title}">
        <div class="search__result-info">
          <div class="search__result-title">${title}</div>
          ${
            original && original !== title
              ? `<div class="search__result-subtitle">${original}</div>`
              : ""
          }
          <div class="search__result-meta">${type}</div>
        </div>
      `;

      card.addEventListener("click", () => {
        dropdown.classList.remove("search__dropdown--active");
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
    if (!e.target.closest(".search"))
      dropdown.classList.remove("search__dropdown--active");
  });
}
