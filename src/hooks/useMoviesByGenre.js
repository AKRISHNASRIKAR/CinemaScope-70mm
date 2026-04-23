import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

/**
 * Fetches movies from TMDB /discover/movie filtered by genre IDs.
 * @param {number[]} genreIds — array of TMDB genre IDs
 */
const useMoviesByGenre = (genreIds = []) => {
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!genreIds.length) return;

    const fetchGenre = async () => {
      setLoading(true);
      try {
        const ids = genreIds.join(",");
        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${ids}&language=en-US&sort_by=popularity.desc&page=1`;
        const res  = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setFilms(data.results || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGenre();
  }, [genreIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { films, loading, error };
};

export default useMoviesByGenre;
