import { Suspense, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import ComingSoonSection from "@/components/sections/ComingSoonSection";
import FreshTrailersSection from "@/components/sections/FreshTrailersSection";
import Hero from "@/components/sections/Hero";
import InTheatersSection from "@/components/sections/InTheatersSection";
import PeopleInFocusSection from "@/components/sections/PeopleInFocusSection";
import StreamingSection from "@/components/sections/StreamingSection";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { HomeHeroSkeleton, TrendingRowSkeleton } from "@/components/ui/Skeletons";

const EMPTY_MOVIES = [];

/* ── Hero Data Wrapper ────────────────────────────────────────── */
const HeroSection = () => {
  const { data } = useSWR("/movie/popular", fetcher, { suspense: true });
  const movies = data?.results ?? EMPTY_MOVIES;
  const featuredFilm = movies[0] ?? null;
  const carouselFilms = useMemo(() => movies.slice(1, 8), [movies]);

  return <Hero film={featuredFilm} relatedFilms={carouselFilms} />;
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

    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton />}>
        <ComingSoonSection />
      </Suspense>
    </ErrorBoundary>

    {/* In theaters — wide landscape carousel inspired by NEON's editorial rhythm */}
    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton count={3} />}>
        <InTheatersSection />
      </Suspense>
    </ErrorBoundary>

    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton />}>
        <PeopleInFocusSection />
      </Suspense>
    </ErrorBoundary>

    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton count={3} />}>
        <FreshTrailersSection />
      </Suspense>
    </ErrorBoundary>

    <ErrorBoundary>
      <Suspense fallback={<TrendingRowSkeleton count={3} />}>
        <StreamingSection />
      </Suspense>
    </ErrorBoundary>

    <MembershipBanner />

    <Footer />
  </main>
);

export default Home;
