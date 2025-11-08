// ==================== COMBINED DATA FILE ====================
// File: AppData.js
// Chứa tất cả data cho Movies, TV Shows và Users

// ==================== MOVIES DATA ====================
export const moviesData = [
  {
    id: 'MV001',
    title: 'Spirited Away',
    overview: 'A young girl named Chihiro becomes trapped in a mysterious world of spirits and must find a way to free herself and her parents.',
    genre: 'Animation, Fantasy',
    duration: 125,
    country: 'Japan',
    director: 'Hayao Miyazaki',
    actors: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    producer: 'Toshio Suzuki',
    budget: 19000000,
    revenue: 395800000,
    rating: 8.6,
    status: 'Released',
    banner: '../../public/assets/image/spiritedaway_baner.jpg',
    poster: '../../public/assets/image/spiritedaway_poster.jpg',
    trailer: 'https://www.youtube.com/watch?v=fDUFP7EeXLE'
  },
  {
    id: 'MV002',
    title: 'Parasite',
    overview: 'A poor family cunningly infiltrates a wealthy household, leading to unexpected consequences and a sharp critique of social inequality.',
    genre: 'Thriller, Drama',
    duration: 132,
    country: 'Korea',
    director: 'Bong Joon-ho',
    actors: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
    producer: 'Kwak Sin-ae',
    budget: 11400000,
    revenue: 258800000,
    rating: 8.5,
    status: 'Released',
    banner: '../../public/assets/image/parasite_baner.jpg',
    poster: '../../public/assets/image/parasite_poster.jpg',
    trailer: 'https://www.youtube.com/watch?v=isOGD_7hNIY'
  },
  {
    id: 'MV003',
    title: 'The Dark Knight',
    overview: 'Batman faces his greatest psychological and moral challenge when he confronts the chaotic criminal mastermind known as the Joker.',
    genre: 'Action, Crime',
    duration: 152,
    country: 'America',
    director: 'Christopher Nolan',
    actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    producer: 'Charles Roven',
    budget: 185000000,
    revenue: 1005000000,
    rating: 9.0,
    status: 'Released',
    banner: '../../public/assets/image/thedarknight_baner.jpg',
    poster: '../../public/assets/image/thedarknight_poster.jpg',
    trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY'
  },
  {
    id: 'MV004',
    title: 'Your Name',
    overview: 'Two high school students mysteriously start switching bodies, creating an emotional and time-twisting journey of love and destiny.',
    genre: 'Animation, Romance',
    duration: 106,
    country: 'Japan',
    director: 'Makoto Shinkai',
    actors: ['Ryunosuke Kamiki', 'Mone Kamishiraishi', 'Ryo Narita'],
    producer: 'Genki Kawamura',
    budget: 6100000,
    revenue: 382000000,
    rating: 8.4,
    status: 'Released',
    banner: '../../public/assets/image/movie_banner_default.png',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    trailer: 'https://www.youtube.com/watch?v=xU47nhruN-Q'
  },
  {
    id: 'MV005',
    title: 'Train to Busan',
    overview: 'A group of passengers on a train must fight for survival when a zombie outbreak sweeps across South Korea.',
    genre: 'Horror, Action',
    duration: 118,
    country: 'Korea',
    director: 'Yeon Sang-ho',
    actors: ['Gong Yoo', 'Ma Dong-seok', 'Jung Yu-mi'],
    producer: 'Lee Dong-ha',
    budget: 8500000,
    revenue: 98500000,
    rating: 7.6,
    status: 'Released',
    banner: '../../public/assets/image/movie_banner_default.png',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    trailer: 'https://www.youtube.com/watch?v=1ovgxN2VWNc'
  },
  {
    id: 'MV006',
    title: 'Avatar 3',
    overview: 'The next chapter in James Cameron s epic saga expands the world of Pandora and explores new clans and uncharted territories.',
    genre: 'Sci-Fi, Adventure',
    duration: 0,
    country: 'America',
    director: 'James Cameron',
    actors: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    producer: 'Jon Landau',
    budget: 0,
    revenue: 0,
    rating: 0,
    status: 'Coming Soon',
    banner: '../../public/assets/image/movie_banner_default.png',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    trailer: 'https://www.youtube.com/watch?v=nb_fFj_0rq8'
  }
];

// ==================== TV SHOWS DATA ====================
export const tvShowsData = [
  {
    id: 'TV001',
    title: 'Breaking Bad',
    overview: 'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student.',
    genre: 'Crime, Drama, Thriller',
    country: 'America',
    creator: 'Vince Gilligan',
    actors: 'Bryan Cranston, Aaron Paul, Anna Gunn',
    producer: 'Sony Pictures Television',
    budget: 3000000,
    revenue: 0,
    trailer: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
    rating: 9.5,
    status: 'Released',
    banner: '../../public/assets/image/movie_banner_default.jpg',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    seasonsData: [
      {
        title: 'Season 1',
        episodes: 7,
        overview: 'Walter White, a struggling high school chemistry teacher, is diagnosed with lung cancer.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 2',
        episodes: 13,
        overview: 'Walt and Jesse are in over their heads with Tuco.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 3',
        episodes: 13,
        overview: 'Walt faces a new adversary in Gus Fring.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 4',
        episodes: 13,
        overview: 'Walt and Gus engage in a deadly game of cat and mouse.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 5',
        episodes: 16,
        overview: 'Walt builds an empire, but at what cost?',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      }
    ]
  },
  {
    id: 'TV002',
    title: 'Game of Thrones',
    overview: 'Nine noble families fight for control over the lands of Westeros.',
    genre: 'Action, Adventure, Drama',
    country: 'America',
    creator: 'David Benioff, D.B. Weiss',
    actors: 'Emilia Clarke, Peter Dinklage, Kit Harington',
    producer: 'HBO Entertainment',
    budget: 10000000,
    revenue: 0,
    trailer: 'https://www.youtube.com/watch?v=KPLWWIOCOOQ',
    rating: 9.2,
    status: 'Released',
    banner: '../../public/assets/image/movie_banner_default.jpg',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    seasonsData: [
      {
        title: 'Season 1',
        episodes: 10,
        overview: 'Lord Eddard Stark is summoned to serve as the King\'s Hand.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 2',
        episodes: 10,
        overview: 'The battle for the Iron Throne continues.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 3',
        episodes: 10,
        overview: 'The Lannisters maintain their hold on King\'s Landing.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      }
    ]
  },
  {
    id: 'TV003',
    title: 'Stranger Things',
    overview: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.',
    genre: 'Drama, Fantasy, Horror',
    country: 'America',
    creator: 'The Duffer Brothers',
    actors: 'Millie Bobby Brown, Finn Wolfhard, Winona Ryder',
    producer: 'Netflix',
    budget: 6000000,
    revenue: 0,
    trailer: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    rating: 8.7,
    status: 'Released',
    banner: '../../public/assets/image/movie_banner_default.jpg',
    poster: '../../public/assets/image/movie_poster_default.jpg',
    seasonsData: [
      {
        title: 'Season 1',
        episodes: 8,
        overview: 'In 1983, a young boy vanishes into thin air.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 2',
        episodes: 9,
        overview: 'Will Byers has been rescued from the Upside Down.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 3',
        episodes: 8,
        overview: 'It\'s the summer of 1985 in Hawkins, Indiana.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      },
      {
        title: 'Season 4',
        episodes: 9,
        overview: 'It\'s been six months since the Battle of Starcourt.',
        poster: '../../public/assets/image/movie_poster_default.jpg'
      }
    ]
  }
];

// ==================== USERS DATA ====================
export const usersData = [
  {
    id: '23521384',
    name: 'Dinh Nguyen Duc Tam',
    email: 'tam@admin.com',
    role: 'Admin',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/30/2025'
  },
  {
    id: '23521749',
    name: 'Do Tan Tuong',
    email: 'tuong@gmail.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/30/2025'
  },
  {
    id: '23521799',
    name: 'Tran Thanh Vinh',
    email: 'vinhc@gmail.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/30/2025'
  },
  {
    id: '23521477',
    name: 'Dao Minh Thien',
    email: 'thiend@gmail.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/30/2025'
  },
  {
    id: '23521505',
    name: 'Nguyen Phuoc Thinh',
    email: 'thinh@gmail.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/30/2025'
  },
  {
    id: 'UIT006',
    name: 'Vo Thi F',
    email: 'vothif@example.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '1/11/2025'
  },
  {
    id: 'UIT007',
    name: 'Dang Van G',
    email: 'dangvang@example.com',
    role: 'User',
    status: 'banned',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '1/11/2025'
  },
  {
    id: 'UIT008',
    name: 'Bui Thi H',
    email: 'buithih@example.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '2/11/2025'
  },
  {
    id: 'UIT009',
    name: 'Do Van I',
    email: 'dovani@example.com',
    role: 'User',
    status: 'active',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '2/11/2025'
  },
  {
    id: 'UIT010',
    name: 'Ngo Thi K',
    email: 'ngothik@example.com',
    role: 'User',
    status: 'banned',
    avatar: '../../public/assets/image/user_avatar_default.jpg',
    createdDate: '10/11/2025'
  }
];