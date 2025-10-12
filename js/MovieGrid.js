const defaultMovies = [
  {
    id: 1,
    title: "Mã 3",
    subtitle: "Code 3",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/0612c593125c118ee8578de9fb16ea421a463ac0?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 2,
    title: "Trưởng Thành Lên",
    subtitle: "Adulthood",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/83bac1a6cd80f538055a0662b00fb831bc1321a7?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 3,
    title: "Zombie Cưng Của Ba",
    subtitle: "My Daughter is a Zombie",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/87a0b4da34b9c360c412fa376f2121dbd1121c74?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 4,
    title: "Thanh Gươm Diệt Quỷ",
    subtitle: "Demon Slayer",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/36f60662f2d9ec942171370c8eb08fd859213c52?width=393",
    badges: [{ text: "T.Minh", type: "green" }],
  },
  {
    id: 5,
    title: "Lupin III",
    subtitle: "The First",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/b15fe3cdca082ad1e63c54b4ccc79589ed29b671?width=393",
    badges: [{ text: "L.Tiếng", type: "blue" }],
  },
  {
    id: 6,
    title: "Thanh Gươm Diệt Quỷ",
    subtitle: "Demon Slayer",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/36f60662f2d9ec942171370c8eb08fd859213c52?width=393",
    badges: [{ text: "T.Minh", type: "green" }],
  },
  {
    id: 7,
    title: "Lupin III",
    subtitle: "The First",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/b15fe3cdca082ad1e63c54b4ccc79589ed29b671?width=393",
    badges: [{ text: "L.Tiếng", type: "blue" }],
  },
  {
    id: 8,
    title: "Mã 3",
    subtitle: "Code 3",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/0612c593125c118ee8578de9fb16ea421a463ac0?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 9,
    title: "Trưởng Thành Lên",
    subtitle: "Adulthood",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/83bac1a6cd80f538055a0662b00fb831bc1321a7?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 10,
    title: "Zombie Cưng Của Ba",
    subtitle: "My Daughter is a Zombie",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/87a0b4da34b9c360c412fa376f2121dbd1121c74?width=393",
    badges: [{ text: "P.Đề", type: "gray" }],
  },
  {
    id: 11,
    title: "Thanh Gươm Diệt Quỷ",
    subtitle: "Demon Slayer",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/36f60662f2d9ec942171370c8eb08fd859213c52?width=393",
    badges: [{ text: "T.Minh", type: "green" }],
  },
  {
    id: 12,
    title: "Lupin III",
    subtitle: "The First",
    poster:
      "https://api.builder.io/api/v1/image/assets/TEMP/b15fe3cdca082ad1e63c54b4ccc79589ed29b671?width=393",
    badges: [{ text: "L.Tiếng", type: "blue" }],
  },
];

// Hàm tạo card phim
function createCard(movie) {
  const card = document.createElement("div");
  card.className = "card";

  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const img = document.createElement("img");
  img.src = movie.poster;
  img.alt = movie.title;
  img.className = "poster";
  img.loading = "lazy";

  const badges = document.createElement("div");
  badges.className = "badges";
  movie.badges.forEach((b) => {
    const badge = document.createElement("div");
    badge.className = `badge badge-${b.type}`;
    badge.textContent = b.text;
    badges.appendChild(badge);
  });

  posterWrap.appendChild(img);
  posterWrap.appendChild(badges);

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = movie.title;

  const subtitle = document.createElement("p");
  subtitle.className = "movie-subtitle";
  subtitle.textContent = movie.subtitle;

  info.appendChild(title);
  info.appendChild(subtitle);

  card.appendChild(posterWrap);
  card.appendChild(info);

  return card;
}

// Hàm render grid
function renderGrid(gridId, movies = defaultMovies) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.warn(`⚠️ Không tìm thấy grid: #${gridId}`);
    return;
  }
  grid.innerHTML = "";
  movies.forEach((movie) => {
    grid.appendChild(createCard(movie));
  });
}

// Export để dùng bên ngoài
export const movieGrid = { renderGrid, createCard };
