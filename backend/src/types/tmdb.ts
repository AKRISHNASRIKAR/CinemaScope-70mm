// TMDB API response shapes — only fields the application actually uses.
// Not exhaustive: extend as new endpoints are consumed.

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: TmdbGenre[];
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  credit_id: string;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  credit_id: string;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbSearchResult {
  results: TmdbMovie[];
  total_results: number;
  total_pages: number;
  page: number;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TmdbWatchProviderRegion {
  link: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

export interface TmdbWatchProviders {
  results: Record<string, TmdbWatchProviderRegion>;
}

export interface TmdbReleaseDate {
  certification: string;
  release_date: string;
  type: number;
}

export interface TmdbReleaseDatesEntry {
  iso_3166_1: string;
  release_dates: TmdbReleaseDate[];
}

export interface TmdbReleaseDates {
  results: TmdbReleaseDatesEntry[];
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbVideos {
  results: TmdbVideo[];
}
