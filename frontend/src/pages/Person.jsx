import { Suspense, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import BookmarkIcon from "@mui/icons-material/Bookmark";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import SEO from "@/components/seo/SEO";
import { PersonHeaderSkeleton, FilmGridSkeleton } from "@/components/ui/Skeletons";
import { profileUrl } from "@/lib/utils/tmdbImage";

/* ── Filmography model ─────────────────────────────────────────────
   TMDB returns two flat arrays — `cast` and `crew` — where crew entries
   carry a `department` ("Directing") and a `job` ("Director"). Grouping
   by department gives the Letterboxd-style role tabs.

   DEPARTMENT_LABELS renames TMDB's internal names into something a
   person would actually read; anything not listed falls through with
   its raw department name rather than being dropped, so unusual roles
   (Costume & Make-Up, Visual Effects…) still get a tab.
─────────────────────────────────────────────────────────────────── */
const ACTING = "Acting";

const DEPARTMENT_LABELS = {
  Acting: "Actor",
  Directing: "Director",
  Writing: "Writer",
  Production: "Producer",
  Camera: "Cinematography",
  Editing: "Editor",
  Sound: "Sound",
  Art: "Art",
  "Visual Effects": "Visual Effects",
  "Costume & Make-Up": "Costume & Make-Up",
  Crew: "Crew",
  Lighting: "Lighting",
};

/* Ties are broken toward the roles people care about most. */
const DEPARTMENT_PRIORITY = ["Acting", "Directing", "Writing", "Production", "Camera", "Editing"];

const SORTS = [
  { key: "popularity", label: "Popular", compare: (a, b) => (b.popularity || 0) - (a.popularity || 0) },
  { key: "rating",     label: "Rating",  compare: (a, b) => (b.vote_average || 0) - (a.vote_average || 0) },
  { key: "newest",     label: "Newest",  compare: (a, b) => (b.release_date || "").localeCompare(a.release_date || "") },
  { key: "oldest",     label: "Oldest",  compare: (a, b) => {
      // Undated credits are usually unreleased — keep them last either way.
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return a.release_date.localeCompare(b.release_date);
    } },
];

/**
 * Bucket every credit by department.
 * A person can hold several jobs on one film (writer *and* director), so
 * credits are deduped by movie id *within* each department and their jobs
 * merged — otherwise Nolan's "Directing" tab lists Inception twice.
 */
function groupCredits(credits, knownFor) {
  const buckets = new Map();

  const push = (dept, film, role) => {
    if (!film?.id) return;
    if (!buckets.has(dept)) buckets.set(dept, new Map());
    const byId = buckets.get(dept);
    const existing = byId.get(film.id);
    if (existing) {
      if (role && !existing.roles.includes(role)) existing.roles.push(role);
      return;
    }
    byId.set(film.id, { ...film, roles: role ? [role] : [] });
  };

  (credits?.cast || []).forEach((c) => push(ACTING, c, c.character));
  (credits?.crew || []).forEach((c) => push(c.department || "Crew", c, c.job));

  return [...buckets.entries()]
    .map(([department, byId]) => ({
      department,
      label: DEPARTMENT_LABELS[department] ?? department,
      films: [...byId.values()],
    }))
    .sort((a, b) => {
      /* What the person is known for leads, even when it isn't their
         biggest bucket — TMDB counts every documentary "Self" appearance
         as an acting credit, so Spielberg has ~190 of those against ~46
         directing. Sorting purely by count would bury Director third and
         leave the default tab scrolled off-screen on mobile. */
      const aKnown = a.department === knownFor;
      const bKnown = b.department === knownFor;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;

      if (b.films.length !== a.films.length) return b.films.length - a.films.length;
      const ai = DEPARTMENT_PRIORITY.indexOf(a.department);
      const bi = DEPARTMENT_PRIORITY.indexOf(b.department);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
}

/* ── Role / sort pill ─────────────────────────────────────────────
   Matches GenrePage's filter bar so the two browse surfaces read as
   one system. `size` steps it down for the secondary sort row. */
const RolePill = ({ active, onClick, children, size = "md" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex-shrink-0 font-body font-medium uppercase whitespace-nowrap rounded-full border transition-all duration-300 cursor-pointer ${
      active
        ? "bg-gold text-black border-gold"
        : "bg-white/[0.04] text-white/55 border-white/10 hover:text-white hover:border-white/25 hover:scale-[1.03]"
    }`}
    style={
      size === "sm"
        ? { fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.14em", padding: "0.38rem 0.85rem" }
        : { fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)", letterSpacing: "0.14em", padding: "0.5rem 1.15rem" }
    }
  >
    {children}
  </button>
);

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
};

/* ── 1. Person Header (Data-driven) ────────────────────────────── */
const PersonHeader = ({ person_id }) => {
  const { data: person } = useSWR(`/person/${person_id}`, fetcher, { suspense: true });
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const born = fmtDate(person.birthday);
  const died = fmtDate(person.deathday);
  
  const bioText = person.biography || "";
  const isLongBio = bioText.length > 400;
  const portraitSrc = profileUrl(person.profile_path, "h632") ?? "/fallback-image.jpg";
  const description =
    bioText ||
    `${person.name} biography, known films, and credits on CinemaScope.`;
  
  const displayBio = isLongBio && !isBioExpanded 
    ? bioText.slice(0, 400) + "..." 
    : bioText;

  return (
    <>
      <SEO
        title={person.name}
        description={description}
        image={portraitSrc}
        canonicalPath={`/person/${person.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: person.name,
          description,
          image: portraitSrc,
          birthDate: person.birthday || undefined,
          deathDate: person.deathday || undefined,
          birthPlace: person.place_of_birth || undefined,
          jobTitle: person.known_for_department || undefined,
        }}
      />
      <div className="flex flex-col sm:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>
      {/* LEFT: Portrait */}
      <div className="sm:w-[38%] lg:w-[35%] flex-shrink-0">
        <div className="relative overflow-hidden" style={{ borderRadius: "8px" }}>
          <LazyImage
            src={portraitSrc}
            alt={person.name}
            fallbackType="person"
            eager={true}
            fetchpriority="high"
            className="w-full aspect-[2/3] object-cover object-top sm:aspect-auto sm:h-auto"
            style={{ maxHeight: "clamp(50vw, 60vh, 600px)" }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base to-transparent" />
        </div>

        {born && (
          <div className="hidden sm:flex items-start mt-6" style={{ gap: "clamp(1rem, 2vw, 2rem)" }}>
            <div>
              <span className="font-mono text-muted uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem, 0.75vw, 0.6rem)" }}>Born</span>
              <p className="font-display font-bold text-gold leading-none" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)", marginTop: "clamp(0.2rem, 0.4vh, 0.3rem)" }}>
                {born.day} {born.month} {born.year}
              </p>
              {person.place_of_birth && (
                <p className="font-body text-muted leading-snug" style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)", marginTop: "clamp(0.15rem, 0.3vh, 0.25rem)" }}>
                  {person.place_of_birth}
                </p>
              )}
            </div>

            {died && (
              <>
                <span className="font-display text-muted self-center" style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)" }}>—</span>
                <div>
                  <span className="font-mono text-muted uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem, 0.75vw, 0.6rem)" }}>Died</span>
                  <p className="font-display font-bold text-white/80 leading-none" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)", marginTop: "clamp(0.2rem, 0.4vh, 0.3rem)" }}>
                    {died.day} {died.month} {died.year}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Bio */}
      <div className="flex-1 min-w-0">
        {person.known_for_department && (
          <p className="font-mono text-gold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)", marginBottom: "clamp(0.5rem, 1vh, 0.75rem)" }}>
            {person.known_for_department}
          </p>
        )}

        <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
          {person.name}
        </h1>

        {bioText && (
          <div style={{ marginTop: "clamp(1.5rem, 3vh, 2.5rem)" }}>
            <div className="flex items-center" style={{ gap: "clamp(0.3rem, 0.6vw, 0.5rem)", marginBottom: "clamp(0.5rem, 1vh, 0.75rem)" }}>
              <BookmarkIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", color: "var(--color-gold)" }} />
              <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)" }}>Biography</h2>
            </div>
            <div className="font-body text-white/55 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
              {displayBio.split("\n").map((para, i) => para.trim() && <p key={i} className="mb-3">{para}</p>)}
              {isLongBio && (
                <button 
                  type="button"
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  aria-expanded={isBioExpanded}
                  className="text-gold hover:text-gold-lt transition-colors font-medium cursor-pointer"
                >
                  {isBioExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile-only Birth/Death */}
        {born && (
          <div className="flex sm:hidden items-center flex-wrap" style={{ gap: "clamp(0.75rem, 2vw, 1.5rem)", marginTop: "clamp(1.5rem, 3vh, 2rem)" }}>
            <div>
              <span className="font-mono text-muted uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.6rem)" }}>Born</span>
              <p className="font-display font-bold text-gold leading-none" style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", marginTop: "2px" }}>
                {born.day} {born.month} {born.year}
              </p>
              {person.place_of_birth && (
                <p className="font-body text-muted" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.65rem)", marginTop: "2px" }}>
                  {person.place_of_birth}
                </p>
              )}
            </div>
            {died && (
              <>
                <span className="font-display text-muted" style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.2rem)" }}>—</span>
                <div>
                  <span className="font-mono text-muted uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.6rem)" }}>Died</span>
                  <p className="font-display font-bold text-white/80 leading-none" style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", marginTop: "2px" }}>
                    {died.day} {died.month} {died.year}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

/* ── 2. Filmography (role tabs + sorting) ─────────────────────────
   Both SWR keys are shared with <PersonHeader/>, so the page still makes
   exactly two person requests through the Edge Function proxy.
─────────────────────────────────────────────────────────────────── */
const Filmography = ({ person_id }) => {
  const { data: credits } = useSWR(`/person/${person_id}/movie_credits`, fetcher, { suspense: true });
  const { data: person } = useSWR(`/person/${person_id}`, fetcher, { suspense: true });

  const groups = useMemo(
    () => groupCredits(credits, person?.known_for_department),
    [credits, person?.known_for_department]
  );

  /* groupCredits already floats the known-for department to the front and
     falls back to the largest bucket, so the first group is the default. */
  const [dept, setDept] = useState(groups[0]?.department ?? null);
  const [sortKey, setSortKey] = useState(SORTS[0].key);

  if (groups.length === 0) return null;

  const active = groups.find((g) => g.department === dept) ?? groups[0];
  const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];
  const films = [...active.films].sort(sort.compare);

  return (
    <div style={{ marginTop: "clamp(2.5rem, 5vh, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}>
      {/* ── Section heading ──────────────────────────────────── */}
      <div
        className="flex items-baseline border-b border-white/[0.08]"
        style={{ gap: "0.6rem", paddingBottom: "clamp(0.5rem,1vh,0.75rem)" }}
      >
        <h2
          className="font-display font-bold text-white tracking-tight"
          style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}
        >
          Filmography
        </h2>
        <span className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)" }}>
          {films.length} {films.length === 1 ? "film" : "films"}
        </span>
      </div>

      {/* ── Controls: roles left, sort right ─────────────────────
          Wraps to two rows on narrow screens; each row scrolls on its
          own rather than squashing the other. */}
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ gap: "clamp(0.6rem, 1.6vh, 1rem)", marginTop: "clamp(0.9rem, 2vh, 1.25rem)" }}
      >
        <div
          className="flex items-center overflow-x-auto scrollbar-hide"
          style={{ gap: "clamp(0.35rem, 1vw, 0.6rem)", flex: "1 1 auto", minWidth: 0 }}
          role="group"
          aria-label="Filter filmography by role"
        >
          {groups.map((g) => (
            <RolePill key={g.department} active={g.department === active.department} onClick={() => setDept(g.department)}>
              {g.label}
              <span className={g.department === active.department ? "text-black/55" : "text-white/30"} style={{ marginLeft: "0.45rem" }}>
                {g.films.length}
              </span>
            </RolePill>
          ))}
        </div>

        <div
          className="flex items-center overflow-x-auto scrollbar-hide"
          style={{ gap: "clamp(0.25rem, 0.7vw, 0.4rem)" }}
          role="group"
          aria-label="Sort filmography"
        >
          <span
            className="font-mono text-faint uppercase whitespace-nowrap"
            style={{ fontSize: "clamp(0.45rem, 0.72vw, 0.55rem)", letterSpacing: "0.2em", marginRight: "0.15rem" }}
          >
            Sort
          </span>
          {SORTS.map((s) => (
            <RolePill key={s.key} size="sm" active={s.key === sort.key} onClick={() => setSortKey(s.key)}>
              {s.label}
            </RolePill>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────
          Every credit is rendered — no cap. LazyImage already defers the
          posters with loading="lazy", so even a 300-credit actor only
          costs DOM nodes. Keyed by department so switching roles remounts
          the cards rather than diffing two unrelated lists. */}
      <div
        key={active.department}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(120px, 15vw, 190px), 1fr))",
          gap: "clamp(0.75rem, 2vw, 1.5rem)",
          marginTop: "clamp(1.25rem, 2.5vh, 1.75rem)",
        }}
      >
        {films.map((film) => (
          <FilmCard
            key={film.id}
            film={film}
            subtitle={
              [film.roles.join(", "), film.release_date?.slice(0, 4)].filter(Boolean).join(" · ") || undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

/* ── Main Page Container ───────────────────────────────────────── */
const Person = () => {
  const { person_id } = useParams();

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <BackButton fallbackRoute="/" />
      <div className="flex-1 center-container" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>

        {/* Header Section */}
        {/* key={person_id}: the route element stays mounted when you navigate
            from one person to another, so without this the expanded-bio and
            selected-role state would carry over to the next person — and a
            role tab like "Directing" may not even exist for them. */}
        <ErrorBoundary key={`header-${person_id}`}>
          <Suspense fallback={<PersonHeaderSkeleton />}>
            <PersonHeader person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

        {/* Filmography */}
        <ErrorBoundary key={`films-${person_id}`}>
          <Suspense fallback={<FilmGridSkeleton count={10} />}>
            <Filmography person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

      </div>
      <Footer />
    </div>
  );
};

export default Person;
