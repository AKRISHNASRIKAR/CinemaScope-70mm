import React, { Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import Hero from "@/components/sections/Hero";
import GenreRow from "@/components/sections/GenreRow";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { FilmDetailHeroSkeleton } from "@/components/ui/Skeletons";
import { GENRE_SECTIONS } from "@/lib/constants";

/* ── Hero Data Wrapper ────────────────────────────────────────── */
const HeroSection = () => {
  const { data } = useSWR("/movie/popular", fetcher, { suspense: true });
  const movies = data.results || [];
  const featuredFilm = movies[0] ?? null;
  const carouselFilms = movies.slice(1, 8);

  return <Hero film={featuredFilm} relatedFilms={carouselFilms} />;
};

const Home = () => {
  return (
    <main className="min-h-screen bg-base">
      
      {/* Popular Movies Hero */}
      <ErrorBoundary>
        <Suspense fallback={<FilmDetailHeroSkeleton />}>
          <HeroSection />
        </Suspense>
      </ErrorBoundary>

      {/* Genre section header */}
      <div className="w-full bg-base" style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "clamp(0.5rem, 1vw, 1rem)" }}>
        <div style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>
          <h2 className="font-display font-bold text-white leading-tight tracking-tight" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            Top Picks by Genre
          </h2>
          <p className="font-body text-muted" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.875rem)", marginTop: "clamp(0.3rem, 0.6vh, 0.5rem)" }}>
            Curated from TMDB
          </p>
        </div>
      </div>

      {/* Genre rows - independent Suspense boundaries inside GenreRow component */}
      {GENRE_SECTIONS.map((section) => (
        <GenreRow
          key={section.id}
          genre={section.genre}
          tagline={section.tagline}
          genreIds={section.genreIds}
          genreId={section.genreIds[0]}
          alignment={section.alignment}
          theme={section.theme}
        />
      ))}

      <Footer />
    </main>
  );
};

export default Home;
