import { Suspense, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LocalMoviesOutlinedIcon from "@mui/icons-material/LocalMoviesOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import ScrollRow from "@/components/ui/ScrollRow";
import SEO from "@/components/seo/SEO";
import { PersonHeaderSkeleton, FilmGridSkeleton } from "@/components/ui/Skeletons";
import { profileUrl } from "@/lib/utils/tmdbImage";

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

const DEPARTMENT_PRIORITY = ["Acting", "Directing", "Writing", "Production", "Camera", "Editing"];

const SORTS = [
  { key: "popularity", label: "Popular", compare: (a, b) => (b.popularity || 0) - (a.popularity || 0) },
  { key: "rating", label: "Rating", compare: (a, b) => (b.vote_average || 0) - (a.vote_average || 0) },
  { key: "newest", label: "Newest", compare: (a, b) => (b.release_date || "").localeCompare(a.release_date || "") },
  {
    key: "oldest",
    label: "Oldest",
    compare: (a, b) => {
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return a.release_date.localeCompare(b.release_date);
    },
  },
];

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

  (credits?.cast || []).forEach((credit) => push(ACTING, credit, credit.character));
  (credits?.crew || []).forEach((credit) => push(credit.department || "Crew", credit, credit.job));

  return [...buckets.entries()]
    .map(([department, byId]) => ({
      department,
      label: DEPARTMENT_LABELS[department] ?? department,
      films: [...byId.values()],
    }))
    .sort((a, b) => {
      const aKnown = a.department === knownFor;
      const bKnown = b.department === knownFor;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;

      if (b.films.length !== a.films.length) return b.films.length - a.films.length;
      const ai = DEPARTMENT_PRIORITY.indexOf(a.department);
      const bi = DEPARTMENT_PRIORITY.indexOf(b.department);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
}

const uniqueCredits = (groups) => [
  ...new Map(
    groups
      .flatMap((group) => group.films)
      .filter((film) => film?.id)
      .map((film) => [film.id, film])
  ).values(),
];

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

const formatYear = (dateStr) => (dateStr ? dateStr.slice(0, 4) : null);

const yearsBetween = (start, end = new Date()) => {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  let years = endDate.getFullYear() - startDate.getFullYear();
  const monthDelta = endDate.getMonth() - startDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && endDate.getDate() < startDate.getDate())) years -= 1;
  return Number.isFinite(years) ? years : null;
};

const titleOf = (film) => film?.title || film?.name || "Untitled";

const subtitleFor = (film) =>
  [film.roles?.slice(0, 2).join(", "), formatYear(film.release_date)].filter(Boolean).join(" / ") || undefined;

const RolePill = ({ active, onClick, children, size = "md" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex-shrink-0 rounded-full border font-body font-semibold uppercase whitespace-nowrap transition-all duration-normal cursor-pointer ${
      active
        ? "border-gold bg-gold text-black shadow-[0_0_28px_rgba(201,168,67,0.18)]"
        : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/25 hover:text-white"
    }`}
    style={
      size === "sm"
        ? { fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.14em", padding: "0.42rem 0.82rem" }
        : { fontSize: "clamp(0.52rem, 0.85vw, 0.66rem)", letterSpacing: "0.16em", padding: "0.56rem 0.95rem" }
    }
  >
    {children}
  </button>
);

const Fact = ({ icon: Icon, label, value, subvalue }) => {
  if (!value) return null;

  return (
    <div className="min-w-0 border-t border-white/10 py-4 sm:border-t-0 sm:border-l sm:py-0 sm:pl-5">
      <div className="flex items-center gap-2 text-gold">
        <Icon sx={{ fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)" }} />
        <span
          className="font-mono uppercase text-white/42"
          style={{ fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.18em" }}
        >
          {label}
        </span>
      </div>
      <p
        className="mt-2 truncate font-body font-semibold text-white"
        style={{ fontSize: "clamp(0.78rem, 1.15vw, 0.95rem)" }}
      >
        {value}
      </p>
      {subvalue && (
        <p className="mt-1 truncate font-body text-white/42" style={{ fontSize: "clamp(0.62rem, 0.9vw, 0.74rem)" }}>
          {subvalue}
        </p>
      )}
    </div>
  );
};

const GrainOverlay = ({ opacity = 0.13 }) => (
  <div
    aria-hidden
    className="absolute inset-0 mix-blend-overlay pointer-events-none"
    style={{
      opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "160px 160px",
    }}
  />
);

const PersonHero = ({ personId }) => {
  const { data: person } = useSWR(`/person/${personId}`, fetcher, { suspense: true });
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const portraitSrc = profileUrl(person.profile_path, "h632") ?? "/fallback-image.jpg";
  const backgroundSrc = profileUrl(person.profile_path, "h632") ?? portraitSrc;
  const bioText = person.biography || "";
  const isLongBio = bioText.length > 520;
  const displayBio = isLongBio && !isBioExpanded ? `${bioText.slice(0, 520).trim()}...` : bioText;
  const description = bioText || `${person.name} biography, known films, and credits on CinemaScope.`;

  const born = formatDate(person.birthday);
  const died = formatDate(person.deathday);
  const age = person.birthday ? yearsBetween(person.birthday, person.deathday ? new Date(person.deathday) : new Date()) : null;
  const lifeValue = person.deathday
    ? [formatYear(person.birthday), formatYear(person.deathday)].filter(Boolean).join(" - ")
    : age !== null
      ? `${age} years old`
      : null;

  return (
    <section
      className="relative isolate overflow-hidden bg-base"
      style={{
        minHeight: "min(100svh, 900px)",
        paddingTop: "calc(var(--navbar-height, 3.5rem) + clamp(2.5rem, 6vh, 5.5rem))",
        paddingBottom: "clamp(3rem, 8vh, 6rem)",
      }}
    >
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

      <div className="absolute inset-0 -z-10" aria-hidden>
        <img
          src={backgroundSrc}
          alt=""
          className="absolute right-[-8vw] top-[-14vh] h-[115vh] w-[58vw] min-w-[28rem] object-cover opacity-20 blur-2xl saturate-[1.15]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(201,168,67,0.16),transparent_34%),linear-gradient(90deg,#090909_0%,rgba(9,9,9,0.9)_38%,rgba(9,9,9,0.58)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-base to-transparent" />
        <GrainOverlay />
      </div>

      <div className="center-container relative z-10">
        <div className="flex flex-col items-stretch lg:flex-row lg:items-end" style={{ gap: "clamp(2rem, 5vw, 5.5rem)" }}>
          <div
            className="group relative mx-auto w-full max-w-[min(76vw,22rem)] flex-shrink-0 lg:mx-0 lg:max-w-none"
            style={{ flexBasis: "clamp(16rem, 31vw, 28rem)" }}
          >
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-card bg-surface"
              style={{ boxShadow: "0 34px 100px rgba(0,0,0,0.62)" }}
            >
              <LazyImage
                src={portraitSrc}
                alt={person.name}
                fallbackType="person"
                eager={true}
                fetchPriority="high"
                className="h-full w-full object-cover object-top transition-transform duration-slow ease-cinematic group-hover:scale-[1.025]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden h-28 w-28 border-l border-b border-gold/40 lg:block" aria-hidden />
            <div className="absolute -right-4 -top-4 hidden h-28 w-28 border-r border-t border-white/15 lg:block" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="font-mono uppercase text-gold"
              style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.72rem)", letterSpacing: "0.32em" }}
            >
              {person.known_for_department || "Profile"}
            </p>

            <h1
              className="mt-3 max-w-[12ch] font-wordmark font-black uppercase text-white"
              style={{
                fontSize: "clamp(3.1rem, 9vw, 8.5rem)",
                lineHeight: 0.84,
                letterSpacing: "-0.07em",
                overflowWrap: "anywhere",
                textShadow: "0 0.08em 0.32em rgba(0,0,0,0.52)",
              }}
            >
              {person.name}
            </h1>

            <div
              className="mt-8 grid grid-cols-1 border-y border-white/10 sm:grid-cols-3"
              style={{ gap: "clamp(0.25rem, 2vw, 1.2rem)", padding: "clamp(0.5rem, 1.4vw, 1rem) 0" }}
            >
              <Fact icon={CalendarTodayOutlinedIcon} label={person.deathday ? "Life" : "Age"} value={lifeValue} subvalue={born ? `Born ${born}` : null} />
              <Fact icon={PlaceOutlinedIcon} label="Origin" value={person.place_of_birth} />
              <Fact icon={LocalMoviesOutlinedIcon} label="Known For" value={person.known_for_department} />
            </div>

            {died && (
              <p className="mt-4 font-mono uppercase text-white/35" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.18em" }}>
                Died {died}
              </p>
            )}

            {bioText && (
              <div className="mt-8 max-w-4xl">
                <div className="flex items-center gap-2">
                  <BookmarkIcon sx={{ fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", color: "var(--color-gold)" }} />
                  <h2 className="font-mono uppercase text-white/50" style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.66rem)", letterSpacing: "0.24em" }}>
                    Biography
                  </h2>
                </div>

                <div
                  className="mt-4 border-l border-white/12 pl-5 font-body text-white/68"
                  style={{ fontSize: "clamp(0.88rem, 1.25vw, 1.05rem)", lineHeight: 1.75 }}
                >
                  {displayBio.split("\n").map((paragraph, index) => (
                    paragraph.trim() ? <p key={index} className="mb-3 last:mb-0">{paragraph}</p> : null
                  ))}
                  {isLongBio && (
                    <button
                      type="button"
                      onClick={() => setIsBioExpanded((value) => !value)}
                      aria-expanded={isBioExpanded}
                      className="mt-4 font-body font-semibold text-gold transition-colors duration-fast hover:text-gold-lt cursor-pointer"
                      style={{ fontSize: "clamp(0.78rem, 1.1vw, 0.9rem)" }}
                    >
                      {isBioExpanded ? "Read Less" : "Read More"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const CareerMetric = ({ label, value, detail }) => (
  <div className="border-t border-white/10 py-5 sm:border-t-0 sm:border-l sm:pl-6">
    <p className="font-mono uppercase text-gold" style={{ fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.22em" }}>
      {label}
    </p>
    <p className="mt-2 truncate font-wordmark font-black uppercase text-white" style={{ fontSize: "clamp(1.1rem, 2.4vw, 2rem)", letterSpacing: "-0.04em" }}>
      {value}
    </p>
    {detail && (
      <p className="mt-1 truncate font-body text-white/42" style={{ fontSize: "clamp(0.65rem, 0.95vw, 0.76rem)" }}>
        {detail}
      </p>
    )}
  </div>
);

const KnownForRail = ({ films }) => {
  if (!films.length) return null;

  return (
    <section className="w-full bg-section-dark text-white" style={{ padding: "clamp(2.25rem, 5vw, 4.75rem) 0" }}>
      <div className="center-container">
        <div
          className="flex flex-wrap items-end justify-between border-y border-white/10"
          style={{ gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(0.9rem, 2vw, 1.25rem) 0", marginBottom: "clamp(1.2rem, 3vw, 2rem)" }}
        >
          <div>
            <p className="font-mono uppercase text-gold" style={{ fontSize: "clamp(0.5rem, 0.82vw, 0.64rem)", letterSpacing: "0.3em" }}>
              Spotlight
            </p>
            <h2 className="mt-2 font-wordmark font-black uppercase leading-[0.86]" style={{ fontSize: "clamp(2rem, 6vw, 5.6rem)", letterSpacing: "-0.06em" }}>
              Known For
            </h2>
          </div>
          <span className="font-mono uppercase text-white/35" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.18em" }}>
            Popular / High-signal credits
          </span>
        </div>

        <ScrollRow
          showArrows={films.length > 6}
          scrollAmount={420}
          gap="clamp(0.8rem, 1.8vw, 1.35rem)"
          arrowSize="2.35rem"
          ariaLabel="Known for films"
        >
          {films.map((film, index) => (
            <div
              key={film.id}
              className="flex-shrink-0"
              style={{ width: "clamp(118px, 13vw, 190px)", scrollSnapAlign: "start" }}
            >
              <FilmCard film={film} subtitle={subtitleFor(film)} eager={index < 3} />
            </div>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
};

const Filmography = ({ personId }) => {
  const { data: credits } = useSWR(`/person/${personId}/movie_credits`, fetcher, { suspense: true });
  const { data: person } = useSWR(`/person/${personId}`, fetcher, { suspense: true });

  const groups = useMemo(
    () => groupCredits(credits, person?.known_for_department),
    [credits, person?.known_for_department]
  );
  const allFilms = useMemo(() => uniqueCredits(groups), [groups]);
  const [dept, setDept] = useState(groups[0]?.department ?? null);
  const [sortKey, setSortKey] = useState(SORTS[0].key);

  if (groups.length === 0) return null;

  const active = groups.find((group) => group.department === dept) ?? groups[0];
  const sort = SORTS.find((item) => item.key === sortKey) ?? SORTS[0];
  const films = [...active.films].sort(sort.compare);
  const knownForFilms = [...allFilms]
    .filter((film) => film.poster_path)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 14);
  const ratedFilms = [...allFilms].filter((film) => film.vote_average);
  const topRated = ratedFilms
    .filter((film) => (film.vote_count || 0) >= 50)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0];
  const fallbackTopRated = topRated ?? ratedFilms.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0];
  const latest = [...allFilms]
    .filter((film) => film.release_date)
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))[0];

  return (
    <>
      <section className="relative overflow-hidden bg-base text-white" style={{ padding: "clamp(2rem, 5vw, 4rem) 0" }}>
        <GrainOverlay opacity={0.08} />
        <div className="center-container relative">
          <div className="grid grid-cols-1 border-y border-white/10 sm:grid-cols-3">
            <CareerMetric label="Credits" value={allFilms.length} detail="Movies in TMDB filmography" />
            <CareerMetric label="Top Rated" value={fallbackTopRated ? titleOf(fallbackTopRated) : "No rating"} detail={fallbackTopRated ? `${fallbackTopRated.vote_average?.toFixed(1)} / 10` : undefined} />
            <CareerMetric label="Latest" value={latest ? titleOf(latest) : "No release"} detail={latest ? formatYear(latest.release_date) : undefined} />
          </div>
        </div>
      </section>

      <KnownForRail films={knownForFilms} />

      <section className="relative overflow-hidden bg-base text-white" style={{ padding: "clamp(2.75rem, 6vw, 5.5rem) 0" }}>
        <div className="center-container">
          <div
            className="flex flex-wrap items-end justify-between border-y border-white/10"
            style={{ gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(0.9rem, 2vw, 1.25rem) 0" }}
          >
            <div>
              <p className="font-mono uppercase text-gold" style={{ fontSize: "clamp(0.5rem, 0.82vw, 0.64rem)", letterSpacing: "0.3em" }}>
                Archive
              </p>
              <h2 className="mt-2 font-wordmark font-black uppercase leading-[0.86]" style={{ fontSize: "clamp(2.15rem, 6.8vw, 6.2rem)", letterSpacing: "-0.06em" }}>
                Filmography
              </h2>
            </div>
            <span className="font-mono uppercase text-white/35" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.62rem)", letterSpacing: "0.18em" }}>
              {films.length} {films.length === 1 ? "credit" : "credits"} / {active.label}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center justify-between border-b border-white/10"
            style={{ gap: "clamp(0.75rem, 2vw, 1.5rem)", padding: "clamp(0.85rem, 1.8vw, 1.15rem) 0" }}
          >
            <div
              className="flex min-w-0 flex-1 items-center overflow-x-auto scrollbar-hide"
              style={{ gap: "clamp(0.4rem, 1vw, 0.65rem)" }}
              role="group"
              aria-label="Filter filmography by role"
            >
              {groups.map((group) => (
                <RolePill key={group.department} active={group.department === active.department} onClick={() => setDept(group.department)}>
                  {group.label}
                  <span className={group.department === active.department ? "text-black/55" : "text-white/30"} style={{ marginLeft: "0.45rem" }}>
                    {group.films.length}
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
              <span className="font-mono uppercase text-white/35" style={{ fontSize: "clamp(0.45rem, 0.72vw, 0.55rem)", letterSpacing: "0.2em", marginRight: "0.15rem" }}>
                Sort
              </span>
              {SORTS.map((item) => (
                <RolePill key={item.key} size="sm" active={item.key === sort.key} onClick={() => setSortKey(item.key)}>
                  {item.label}
                </RolePill>
              ))}
            </div>
          </div>

          <div
            key={active.department}
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(clamp(118px, 14vw, 190px), 1fr))",
              gap: "clamp(0.85rem, 2vw, 1.5rem)",
              marginTop: "clamp(1.25rem, 2.5vh, 1.75rem)",
            }}
          >
            {films.map((film) => (
              <FilmCard key={film.id} film={film} subtitle={subtitleFor(film)} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const Person = () => {
  const { person_id } = useParams();

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <BackButton
        fallbackRoute="/"
        className="h-10 w-10 rounded-full border border-white/10 bg-black/35 backdrop-blur-md hover:bg-black/55"
      />
      <main className="flex-1">
        <ErrorBoundary key={`header-${person_id}`}>
          <Suspense fallback={<PersonHeaderSkeleton />}>
            <PersonHero personId={person_id} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary key={`films-${person_id}`}>
          <Suspense fallback={<div className="center-container" style={{ padding: "clamp(3rem, 7vw, 6rem) 0" }}><FilmGridSkeleton count={10} /></div>}>
            <Filmography personId={person_id} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default Person;
