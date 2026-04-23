export const logoURL = "/logo1.png";

// TMDB genre ID → genre name mapping (source: /genre/movie/list endpoint)
export const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// Genre sections rendered on the Home page — order matters
export const GENRE_SECTIONS = [
  {
    id:        "drama-romance",
    genre:     "DRAMA & ROMANCE",
    tagline:   "Exciting, emotional and unexpected.",
    genreIds:  [18, 10749],
    theme:     "light",
    alignment: "left",
  },
  {
    id:        "action-adventure",
    genre:     "ACTION & ADVENTURE",
    tagline:   "Thrilling, explosive, and larger than life.",
    genreIds:  [28, 12],
    theme:     "dark",
    alignment: "right",
  },
  {
    id:        "comedy",
    genre:     "COMEDY",
    tagline:   "Amusing, humorous, and over the top.",
    genreIds:  [35],
    theme:     "mid",
    alignment: "left",
  },
];
