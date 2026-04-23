/* ──────────────────────────────────────────────────────────────────
   StatsBlock — sits at the top of homepage content below the hero.
   Dark / near-black background with large stat numbers left, heading
   and description right, and a dramatic film image bleeding from center.
────────────────────────────────────────────────────────────────── */

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
      <div className="max-w-screen-xl mx-auto grid grid-cols-12 items-end min-h-[420px]">

        {/* ── Left: Stat numbers ────────────────────────── */}
        <div className="col-span-3 flex flex-col gap-6 py-16 pl-12 pr-6 z-10">
          {STATS.map((stat, i) => (
            <div key={stat.label}>
              <p
                className="font-display font-bold text-white leading-none"
                style={{ fontSize: "clamp(3rem, 5vw, 5rem)" }}
              >
                {stat.number}
              </p>
              <p className="font-body text-caption text-muted mt-1 tracking-[0.1em] uppercase">
                {stat.label}
              </p>
              {i < STATS.length - 1 && (
                <hr className="mt-6 border-white/10 w-10" />
              )}
            </div>
          ))}
        </div>

        {/* ── Center: Dramatic film poster bleed ───────── */}
        <div className="col-span-4 relative self-stretch flex items-end justify-center">
          {posterUrl && (
            <>
              {/* Glow behind poster */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-white/5 blur-3xl rounded-full" />
              <img
                src={posterUrl}
                alt={featuredFilm?.title}
                className="relative z-10 w-52 object-cover shadow-card-hover"
                style={{ borderRadius: "6px 6px 0 0" }}
              />
            </>
          )}
          {/* Left fade into stat col */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-base to-transparent z-20" />
          {/* Right fade into text col */}
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-base to-transparent z-20" />
        </div>

        {/* ── Right: Heading + description ─────────────── */}
        <div className="col-span-5 flex flex-col justify-center gap-5 py-16 pl-6 pr-12 z-10">
          <h2
            className="font-display font-bold text-white leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3.5rem)" }}
          >
            CINEMASCOPE
          </h2>
          <p className="font-body font-light text-sm text-muted leading-relaxed max-w-sm">
            Discover award‑winning cinema, hidden gems, and everything
            in between. Your personal guide to the world's greatest films.
          </p>

          {/* Mini featured film card */}
          {featuredFilm && (
            <div className="flex items-center gap-3 mt-2 p-3 rounded-card border border-border bg-surface/60 max-w-xs">
              <img
                src={
                  featuredFilm.backdrop_path
                    ? `https://image.tmdb.org/t/p/w300${featuredFilm.backdrop_path}`
                    : "/fallback-image-film.jpg"
                }
                alt={featuredFilm.title}
                className="w-20 h-12 object-cover rounded-[4px] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-body text-caption font-medium text-white line-clamp-1">
                  {featuredFilm.title}
                </p>
                <p className="font-mono text-tag text-muted mt-0.5 tracking-[0.08em]">
                  NOW FEATURED
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StatsBlock;
