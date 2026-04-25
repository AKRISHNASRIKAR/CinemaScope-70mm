import LazyImage from "@/components/ui/LazyImage";

const STATS = [
  { number: "10K+", label: "Films in Library" },
  { number: "4.8",  label: "Average User Rating" },
];

const StatsBlock = ({ featuredFilm }) => {
  const posterUrl = featuredFilm?.poster_path
    ? `https://image.tmdb.org/t/p/w500${featuredFilm.poster_path}`
    : null;

  return (
    <section className="relative w-full bg-base overflow-hidden">
      <div
        className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-end"
        style={{ minHeight: "clamp(280px, 40vh, 420px)" }}
      >
        {/* ── Left: Stat numbers ─── */}
        <div className="lg:col-span-3 flex flex-col z-10" style={{ gap: "clamp(1rem, 2vh, 1.5rem)", padding: "clamp(2rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem)" }}>
          {STATS.map((stat, i) => (
            <div key={stat.label}>
              <p className="font-display font-bold text-white leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>
                {stat.number}
              </p>
              <p className="font-body text-muted tracking-[0.1em] uppercase" style={{ fontSize: "clamp(0.6rem, 1vw, 0.75rem)", marginTop: "clamp(0.2rem, 0.4vh, 0.35rem)" }}>
                {stat.label}
              </p>
              {i < STATS.length - 1 && <hr className="border-white/10 w-10" style={{ marginTop: "clamp(1rem, 2vh, 1.5rem)" }} />}
            </div>
          ))}
        </div>

        {/* ── Center: Poster bleed ─── */}
        <div className="hidden lg:flex lg:col-span-4 relative self-stretch items-end justify-center">
          {posterUrl && (
            <>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-white/5 blur-3xl rounded-full" />
              <div className="relative z-10 shadow-card-hover" style={{ width: "clamp(10rem, 14vw, 13rem)", borderRadius: "6px 6px 0 0", overflow: "hidden" }}>
                <LazyImage
                  src={posterUrl}
                  alt={featuredFilm?.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          )}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-base to-transparent z-20" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-base to-transparent z-20" />
        </div>

        {/* ── Right: Heading ─── */}
        <div className="lg:col-span-5 flex flex-col justify-center z-10" style={{ gap: "clamp(0.75rem, 1.5vh, 1.25rem)", padding: "clamp(2rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem)" }}>
          <h2 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 3.5rem)" }}>
            Top Picks<br />by Genre
          </h2>
          <p className="font-body font-light text-muted leading-relaxed max-w-sm" style={{ fontSize: "clamp(0.75rem, 1.1vw, 0.9rem)" }}>
            Discover award‑winning cinema, hidden gems, and everything in between. Your personal guide to the world's greatest films.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsBlock;
