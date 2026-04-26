import React, { Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import Hero from "@/components/sections/Hero";
import GenreRow from "@/components/sections/GenreRow";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import ScrollRow from "@/components/ui/ScrollRow";
import { HomeHeroSkeleton } from "@/components/ui/Skeletons";
import { GENRE_SECTIONS } from "@/lib/constants";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

/* ── Hero Data Wrapper ────────────────────────────────────────── */
const HeroSection = () => {
  const { data } = useSWR("/movie/popular", fetcher, { suspense: true });
  const movies = data.results || [];
  const featuredFilm = movies[0] ?? null;
  const carouselFilms = movies.slice(1, 8);

  return <Hero film={featuredFilm} relatedFilms={carouselFilms} />;
};

/* ── Recently Viewed Row ─────────────────────────────────────── */
const RecentlyViewedRow = () => {
  const { recentFilms, clearRecent } = useRecentlyViewed();
  if (recentFilms.length === 0) return null;

  return (
    <div className="w-full bg-base" style={{ paddingTop: "clamp(1.5rem,3vw,2.5rem)", paddingBottom: "clamp(0.5rem,1vw,1rem)" }}>
      <div className="center-container px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between" style={{ marginBottom: "clamp(0.75rem,1.5vh,1rem)" }}>
          <h2 className="font-display font-bold text-white leading-tight tracking-tight" style={{ fontSize: "clamp(1rem,1.8vw,1.4rem)" }}>
            Recently Viewed
          </h2>
          <button
            onClick={clearRecent}
            className="font-body text-muted hover:text-white/70 transition-colors duration-fast cursor-pointer"
            style={{ fontSize: "clamp(0.55rem,0.85vw,0.7rem)" }}
          >
            Clear
          </button>
        </div>
        <ScrollRow
          showArrows={recentFilms.length > 5}
          scrollAmount={280}
          gap="clamp(0.75rem,1.5vw,1.25rem)"
          arrowSize="2.25rem"
        >
          {recentFilms.map((film) => (
            <div
              key={film.id}
              className="flex-shrink-0"
              style={{ width: "clamp(90px,10vw,150px)", scrollSnapAlign: "start" }}
            >
              <FilmCard film={film} />
            </div>
          ))}
        </ScrollRow>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <main className="min-h-screen bg-base">

      {/* Popular Movies Hero */}
      <ErrorBoundary>
        <Suspense fallback={<HomeHeroSkeleton />}>
          <HeroSection />
        </Suspense>
      </ErrorBoundary>

      {/* Recently Viewed — client-only, no Suspense needed */}
      <RecentlyViewedRow />

      {/* Genre section header */}
      <div className="w-full bg-base" style={{ paddingTop: "clamp(1.5rem, 3vw, 2.5rem)", paddingBottom: "clamp(0.25rem, 0.5vw, 0.5rem)" }}>
        <div className="center-container px-4 sm:px-6 lg:px-12">
          <h2 className="font-display font-bold text-white leading-tight tracking-tight" style={{ fontSize: "clamp(1.1rem, 2vw, 1.6rem)" }}>
            Top Picks by Genre
          </h2>
        </div>
      </div>

      {/* Genre rows */}
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
