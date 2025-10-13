import { TMDB_API_KEY } from "../config.js";

export async function searchBar() {
  try {
    const input = document.querySelector(".search-input");
    /* const res = await fetch(
      `https://api.themoviedb.org/`
    );
    const data = await res.json(); */
    input.addEventListener("input", (e) => {
      console.log("Người dùng đang gõ:", e.target.value);
    });
  } catch (error) {}
}
