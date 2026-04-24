import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import Hero from "@/components/sections/Hero";
import StatsBlock from "@/components/sections/StatsBlock";
import GenreRow from "@/components/sections/GenreRow";
import Footer from "@/components/layout/Footer";
import { GENRE_SECTIONS } from "@/lib/constants";

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
      <div className="min-h-screen bg-base flex items-center justify-center" style={{ padding: "clamp(1rem, 4vw, 2rem)" }}>
        <p className="text-red-400 font-body" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>{error}</p>
      </div>
    );
  }

  const featuredFilm  = movies[0] ?? null;
  const carouselFilms = movies.slice(1, 8);

  return (
    <main className="min-h-screen bg-base">
      <Hero film={featuredFilm} relatedFilms={carouselFilms} />
      <StatsBlock featuredFilm={featuredFilm} />
      {GENRE_SECTIONS.map((section) => (
        <GenreRow
          key={section.id}
          genre={section.genre}
          tagline={section.tagline}
          genreIds={section.genreIds}
          alignment={section.alignment}
          theme={section.theme}
        />
      ))}
      <Footer />
    </main>
  );
};

export default Home;
