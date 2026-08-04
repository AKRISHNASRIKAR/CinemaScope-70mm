import { Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import Hero from "@/components/sections/Hero";
import GenreRow from "@/components/sections/GenreRow";
import TrendingRow from "@/components/sections/TrendingRow";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import ScrollRow from "@/components/ui/ScrollRow";
import SectionHeader from "@/components/ui/SectionHeader";
import { HomeHeroSkeleton, TrendingRowSkeleton } from "@/components/ui/Skeletons";
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
    <section className="w-full bg-base" style={{ paddingTop: "clamp(1.5rem,3vw,2.5rem)", paddingBottom: "clamp(0.5rem,1vw,1rem)" }}>
      <div className="center-container">
        <SectionHeader
          eyebrow="Pick up where you left off"
          title="Recently Viewed"
          action={
            <button
              onClick={clearRecent}
              className="font-body text-muted hover:text-white/80 transition-colors duration-fast cursor-pointer"
              style={{ fontSize: "clamp(0.55rem,0.85vw,0.7rem)" }}
            >
              Clear
            </button>
          }
        />

        <ScrollRow
          showArrows={recentFilms.length > 5}
          scrollAmount={280}
          gap="clamp(0.75rem,1.5vw,1.25rem)"
          arrowSize="2.25rem"
          ariaLabel="Recently viewed films"
        >
          {recentFilms.map((film) => (
            <div
              key={film.id}
              className="flex-shrink-0 transition-all duration-300 hover:scale-[1.02]"
              style={{ width: "clamp(100px,11vw,160px)", scrollSnapAlign: "start" }}
            >
              <FilmCard film={film} />
            </div>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
};

/* ── Membership CTA — only for signed-out visitors ───────────── */
const MembershipBanner = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  if (isAuthenticated || isLoading) return null;

  return (
    <section className="w-full bg-base" style={{ padding: "clamp(2rem, 5vw, 4rem) 0" }}>
      <div className="center-container">
        <div
          className="relative overflow-hidden rounded-card border border-white/10 flex flex-wrap items-center justify-between transition-all duration-300 hover:border-gold/30"
          style={{
            gap: "clamp(1rem, 3vw, 2.5rem)",
            padding: "clamp(1.5rem, 4vw, 2.5rem)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(80% 120% at 0% 0%, rgba(201,168,67,0.12) 0%, rgba(9,9,9,0) 60%)" }}
          />

          <div className="relative" style={{ flex: "1 1 clamp(240px, 45vw, 620px)", minWidth: 0 }}>
            <p
              className="font-mono text-gold uppercase"
              style={{ fontSize: "clamp(0.45rem, 0.75vw, 0.6rem)", letterSpacing: "0.32em" }}
            >
              Member pass
            </p>
            <h2
              className="font-display font-bold text-white leading-tight tracking-tight"
              style={{ fontSize: "clamp(1.2rem, 2.4vw, 2rem)", marginTop: "clamp(0.4rem, 1vh, 0.65rem)" }}
            >
              Keep your films in sync
            </h2>
            <p
              className="font-body text-white/50 leading-relaxed"
              style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.88rem)", marginTop: "clamp(0.35rem, 0.8vh, 0.55rem)", maxWidth: "56ch" }}
            >
              Sign in to unlock your profile and side-by-side film comparisons. Browsing stays free and open.
            </p>
          </div>

          <button
            onClick={() => loginWithRedirect()}
            className="relative font-body font-semibold text-black bg-gold hover:bg-gold-lt rounded-full transition-all duration-300 hover:scale-[1.04] active:scale-[0.99] cursor-pointer flex-shrink-0"
            style={{ padding: "0.8rem 2rem", fontSize: "clamp(0.7rem, 1.1vw, 0.88rem)" }}
          >
            Sign in
          </button>
        </div>
      </div>
    </section>
  );
};

/* ── Page ─────────────────────────────────────────────────────── */
const Home = () => (
  <main className="min-h-screen bg-base">

    {/* Featured films hero — above the fold, eager imagery */}
    <ErrorBoundary>
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HeroSection />
      </Suspense>
    </ErrorBoundary>

    {/* Recently Viewed — client-only, no Suspense needed */}
    <RecentlyViewedRow />

    {/* Trending — independent boundary so a slow/failed fetch is contained */}
    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton />}>
        <TrendingRow />
      </Suspense>
    </ErrorBoundary>

    {/* Genre sections */}
    <div className="w-full bg-base" style={{ paddingTop: "clamp(2rem, 4vw, 3rem)", paddingBottom: "clamp(0.25rem, 0.5vw, 0.5rem)" }}>
      <div className="center-container">
        <SectionHeader eyebrow="Curated" title="Top Picks by Genre" divider={false} />
      </div>
    </div>

    {GENRE_SECTIONS.map((section) => (
      <GenreRow
        key={section.id}
        genre={section.genre}
        tagline={section.tagline}
        genreIds={section.genreIds}
        genreId={section.genreId ?? section.genreIds[0]}
        alignment={section.alignment}
        theme={section.theme}
      />
    ))}

    <MembershipBanner />

    <Footer />
  </main>
);

export default Home;
