import { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import Hero from "@/components/sections/Hero";
import StatsBlock from "@/components/sections/StatsBlock";
import GenreRow from "@/components/sections/GenreRow";
import { GENRE_SECTIONS } from "@/lib/constants";

/* ── per-genre data fetcher (keeps Home clean) ─────────────────── */
const useMoviesByGenre = (genreIds) => {
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE = import.meta.env.VITE_BASE_URL;
  const KEY  = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    if (!genreIds?.length) return;
    const ids = genreIds.join(",");
    fetch(`${BASE}/discover/movie?api_key=${KEY}&with_genres=${ids}&language=en-US&sort_by=popularity.desc`)
      .then((r) => r.json())
      .then((d) => setFilms(d.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [genreIds.join(",")]); // eslint-disable-line

  return { films, loading };
};

/* ── thin wrapper so each GenreRow fetches its own data ─────────── */
const GenreSection = ({ section }) => {
  const { films, loading } = useMoviesByGenre(section.genreIds);
  if (loading || !films.length) return null;
  return (
    <GenreRow
      genre={section.genre}
      tagline={section.tagline}
      films={films}
      alignment={section.alignment}
      theme={section.theme}
    />
  );
};

/* ── main page ───────────────────────────────────────────────────── */
const Home = () => {
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_KEY      = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        if (!API_BASE_URL || !API_KEY) throw new Error("Missing env vars");
        const res = await fetch(
          `${API_BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMovies(data.results);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [API_BASE_URL, API_KEY]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <CircularProgress sx={{ color: "#c9a843" }} />
      </div>
    );
  }

  if (error) {
    return (
      <Box mt={2} px={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const featuredFilm  = movies[0]    ?? null;
  const carouselFilms = movies.slice(1, 8);

  return (
    <main className="min-h-screen bg-base">
      {/* ── Hero — full viewport, navbar floats over it ── */}
      <Hero film={featuredFilm} relatedFilms={carouselFilms} />

      {/* ── Stats block ── */}
      <StatsBlock featuredFilm={featuredFilm} />

      {/* ── Genre rows — each fetches its own data ── */}
      {GENRE_SECTIONS.map((section) => (
        <GenreSection key={section.id} section={section} />
      ))}
    </main>
  );
};

export default Home;
