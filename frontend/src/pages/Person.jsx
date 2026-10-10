import { Suspense, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LocalMoviesOutlinedIcon from "@mui/icons-material/LocalMoviesOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FilmCard from "@/components/ui/FilmCard";
import SEO from "@/components/seo/SEO";
import { PersonHeaderSkeleton, FilmGridSkeleton } from "@/components/ui/Skeletons";
import { profileUrl } from "@/lib/utils/tmdbImage";

const ACTING = "Acting";
const ALL_CREDITS = "all";

const DEPARTMENT_LABELS = {
  Acting: "Acting",
  Directing: "Directing",
  Writing: "Writing",
  Production: "Production",
  Camera: "Cinematography",
  Editing: "Editing",
  Sound: "Sound",
  Art: "Art",
  "Visual Effects": "Visual Effects",
  "Costume & Make-Up": "Costume",
  Crew: "Crew",
  Lighting: "Lighting",
};

const DEPARTMENT_PRIORITY = ["Acting", "Directing", "Writing", "Production", "Camera", "Editing"];

const compareDatesNewest = (a, b) => {
  if (!a.release_date && !b.release_date) return 0;
  if (!a.release_date) return 1;
  if (!b.release_date) return -1;
  return b.release_date.localeCompare(a.release_date);
};

const compareDatesOldest = (a, b) => {
  if (!a.release_date && !b.release_date) return 0;
  if (!a.release_date) return 1;
  if (!b.release_date) return -1;
  return a.release_date.localeCompare(b.release_date);
};

const SORTS = [
  { key: "popularity", label: "Popular", compare: (a, b) => (b.popularity || 0) - (a.popularity || 0) },
  { key: "newest", label: "Newest", compare: compareDatesNewest },
  { key: "oldest", label: "Oldest", compare: compareDatesOldest },
  { key: "rating", label: "Rating", compare: (a, b) => (b.vote_average || 0) - (a.vote_average || 0) },
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

const mergeAllCredits = (groups) => {
  const byId = new Map();

  groups.forEach((group) => {
    group.films.forEach((film) => {
      if (!film?.id) return;
      const roles = [group.label, ...(film.roles || [])].filter(Boolean);
      const existing = byId.get(film.id);

      if (existing) {
        roles.forEach((role) => {
          if (!existing.roles.includes(role)) existing.roles.push(role);
        });
        return;
      }

      byId.set(film.id, { ...film, roles });
    });
  });

  return [...byId.values()];
};

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

const subtitleFor = (film) =>
  [film.roles?.slice(0, 2).join(", "), formatYear(film.release_date)].filter(Boolean).join(" / ") || undefined;

const ToggleButton = ({ active, onClick, children, size = "md" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex-shrink-0 rounded-full border font-body font-semibold uppercase whitespace-nowrap transition-all duration-normal cursor-pointer focus-ring ${
      active
        ? "border-gold bg-gold text-black shadow-[0_0_28px_rgba(201,168,67,0.18)]"
        : "border-white/10 bg-white/[0.04] text-white/48 hover:border-white/25 hover:text-white"
    }`}
    style={
      size === "sm"
        ? { fontSize: "clamp(0.5rem, 0.72vw, 0.6rem)", letterSpacing: "0.14em", padding: "0.42rem 0.78rem" }
        : { fontSize: "clamp(0.52rem, 0.82vw, 0.64rem)", letterSpacing: "0.16em", padding: "0.52rem 0.9rem" }
    }
  >
    {children}
  </button>
);

const MetaItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex min-w-0 items-start gap-2 border-t border-white/10 py-3">
      <Icon sx={{ fontSize: "0.95rem", color: "var(--color-gold)", marginTop: "0.15rem", flexShrink: 0 }} />
      <div className="min-w-0">
        <p className="font-mono uppercase text-white/38" style={{ fontSize: "0.55rem", letterSpacing: "0.18em" }}>
          {label}
        </p>
        <p className="mt-1 font-body text-white/78" style={{ fontSize: "clamp(0.72rem, 1vw, 0.84rem)", lineHeight: 1.45 }}>
          {value}
        </p>
      </div>
    </div>
  );
};

const GrainOverlay = ({ opacity = 0.1 }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 mix-blend-overlay"
    style={{
      opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "150px 150px",
    }}
  />
);

const ProfileRail = ({ person, totalCredits }) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const portraitSrc = profileUrl(person.profile_path, "h632") ?? "/fallback-image.jpg";
  const born = formatDate(person.birthday);
  const died = formatDate(person.deathday);
  const age = person.birthday ? yearsBetween(person.birthday, person.deathday ? new Date(person.deathday) : new Date()) : null;
  const lifeValue = person.deathday
    ? [formatYear(person.birthday), formatYear(person.deathday)].filter(Boolean).join(" - ")
    : age !== null
      ? `${age} years old`
      : null;
  const bioText = person.biography || "";
  const isLongBio = bioText.length > 420;
  const displayBio = isLongBio && !isBioExpanded ? `${bioText.slice(0, 420).trim()}...` : bioText;

  return (
    <aside className="person-profile-rail min-w-0 lg:sticky lg:top-[calc(var(--navbar-height,3.5rem)+1.25rem)] lg:self-start">
      <div
        className="relative overflow-hidden rounded-card border border-white/10 bg-white/[0.035]"
        style={{
          padding: "clamp(0.72rem, 1.4vw, 1rem)",
          boxShadow: "0 34px 120px rgba(0,0,0,0.32)",
        }}
      >
        <div className="group relative aspect-[3/4] overflow-hidden rounded-card bg-surface">
          <LazyImage
            src={portraitSrc}
            alt={person.name}
            fallbackType="person"
            eager={true}
            fetchPriority="high"
            className="h-full w-full object-cover object-top transition-transform duration-slow ease-cinematic group-hover:scale-[1.025]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      <div className="mt-5">
        <p
          className="font-mono uppercase text-gold"
          style={{ fontSize: "clamp(0.52rem, 0.86vw, 0.64rem)", letterSpacing: "0.26em" }}
        >
          {person.known_for_department || "Profile"}
        </p>
        <h1
          className="mt-2 font-wordmark font-black uppercase text-white"
          style={{
            fontSize: "clamp(1.9rem, 4vw, 3.35rem)",
            lineHeight: 0.88,
            letterSpacing: "-0.045em",
            overflowWrap: "anywhere",
          }}
        >
          {person.name}
        </h1>
      </div>

      <div className="mt-5 border-b border-white/10">
        <MetaItem icon={CalendarTodayOutlinedIcon} label={person.deathday ? "Life" : "Age"} value={lifeValue} />
        <MetaItem icon={CalendarTodayOutlinedIcon} label="Born" value={born} />
        <MetaItem icon={PlaceOutlinedIcon} label="Origin" value={person.place_of_birth} />
        <MetaItem icon={LocalMoviesOutlinedIcon} label="Credits" value={`${totalCredits} ${totalCredits === 1 ? "film" : "films"}`} />
        {died && <MetaItem icon={CalendarTodayOutlinedIcon} label="Died" value={died} />}
      </div>

      {bioText && (
        <section className="mt-5" aria-labelledby="person-biography-heading">
          <h2
            id="person-biography-heading"
            className="font-mono uppercase text-white/42"
            style={{ fontSize: "0.58rem", letterSpacing: "0.22em" }}
          >
            Biography
          </h2>
          <div
            className="mt-3 font-body text-white/58"
            style={{ fontSize: "clamp(0.72rem, 1vw, 0.86rem)", lineHeight: 1.68 }}
          >
            {displayBio.split("\n").map((paragraph, index) =>
              paragraph.trim() ? (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ) : null
            )}
            {isLongBio && (
              <button
                type="button"
                onClick={() => setIsBioExpanded((value) => !value)}
                aria-expanded={isBioExpanded}
                className="mt-2 font-body font-semibold text-gold transition-colors duration-fast hover:text-gold-lt focus-ring cursor-pointer"
                style={{ fontSize: "0.78rem" }}
              >
                {isBioExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </div>
        </section>
      )}
    </aside>
  );
};

const FilmographyPanel = ({ groups, allFilms }) => {
  const [activeDept, setActiveDept] = useState(ALL_CREDITS);
  const [sortKey, setSortKey] = useState(SORTS[0].key);

  const activeGroup = groups.find((group) => group.department === activeDept);
  const sourceFilms = activeDept === ALL_CREDITS ? allFilms : activeGroup?.films ?? allFilms;
  const sort = SORTS.find((item) => item.key === sortKey) ?? SORTS[0];
  const films = useMemo(() => [...sourceFilms].sort(sort.compare), [sourceFilms, sort]);
  const label = activeDept === ALL_CREDITS ? "All Credits" : activeGroup?.label ?? "Filmography";
  const firstYear = useMemo(
    () => [...allFilms].filter((film) => film.release_date).sort(compareDatesOldest)[0],
    [allFilms]
  );
  const latestYear = useMemo(
    () => [...allFilms].filter((film) => film.release_date).sort(compareDatesNewest)[0],
    [allFilms]
  );
  const years = [formatYear(firstYear?.release_date), formatYear(latestYear?.release_date)]
    .filter(Boolean)
    .join(" - ");

  return (
    <section className="min-w-0" aria-labelledby="filmography-heading">
      <div
        className="border-y border-white/10"
        style={{ padding: "clamp(0.9rem, 2vw, 1.25rem) 0", marginBottom: "clamp(0.9rem, 2vw, 1.25rem)" }}
      >
        <div className="flex flex-wrap items-end justify-between" style={{ gap: "clamp(0.75rem, 2vw, 1.25rem)" }}>
          <div className="min-w-0">
            <p
              className="font-mono uppercase text-gold"
              style={{ fontSize: "clamp(0.52rem, 0.82vw, 0.64rem)", letterSpacing: "0.28em" }}
            >
              Archive
            </p>
            <h2
              id="filmography-heading"
              className="mt-2 font-wordmark font-black uppercase text-white"
              style={{ fontSize: "clamp(2.2rem, 6vw, 5.25rem)", lineHeight: 0.84, letterSpacing: "-0.055em" }}
            >
              Filmography
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <p
              className="font-mono uppercase text-white/42"
              style={{ fontSize: "clamp(0.5rem, 0.78vw, 0.6rem)", letterSpacing: "0.18em" }}
            >
              {films.length} {films.length === 1 ? "credit" : "credits"}
            </p>
            {years && (
              <p className="mt-1 font-body text-white/45" style={{ fontSize: "clamp(0.7rem, 1vw, 0.82rem)" }}>
                {years}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-card border border-white/10 bg-white/[0.025]"
        style={{
          padding: "clamp(0.8rem, 1.7vw, 1.15rem)",
          marginBottom: "clamp(1rem, 2.6vw, 1.7rem)",
        }}
      >
        <div className="flex flex-col" style={{ gap: "clamp(0.75rem, 1.6vw, 1rem)" }}>
          <div>
            <p className="font-mono uppercase text-white/35" style={{ fontSize: "0.55rem", letterSpacing: "0.2em", marginBottom: "0.55rem" }}>
              Role
            </p>
            <div
              className="flex min-w-0 items-center overflow-x-auto pb-1 scrollbar-hide"
              style={{ gap: "clamp(0.4rem, 1vw, 0.65rem)" }}
              role="group"
              aria-label="Filter filmography by role"
            >
              <ToggleButton active={activeDept === ALL_CREDITS} onClick={() => setActiveDept(ALL_CREDITS)}>
                All
                <span className={activeDept === ALL_CREDITS ? "text-black/55" : "text-white/30"} style={{ marginLeft: "0.45rem" }}>
                  {allFilms.length}
                </span>
              </ToggleButton>
              {groups.map((group) => (
                <ToggleButton key={group.department} active={group.department === activeDept} onClick={() => setActiveDept(group.department)}>
                  {group.label}
                  <span className={group.department === activeDept ? "text-black/55" : "text-white/30"} style={{ marginLeft: "0.45rem" }}>
                    {group.films.length}
                  </span>
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-white/50" style={{ fontSize: "clamp(0.72rem, 1vw, 0.84rem)" }}>
              Showing {label.toLowerCase()} sorted by {sort.label.toLowerCase()}.
            </p>
            <div
              className="flex items-center overflow-x-auto pb-1 scrollbar-hide"
              style={{ gap: "clamp(0.3rem, 0.8vw, 0.45rem)" }}
              role="group"
              aria-label="Sort filmography"
            >
              {SORTS.map((item) => (
                <ToggleButton key={item.key} size="sm" active={item.key === sort.key} onClick={() => setSortKey(item.key)}>
                  {item.label}
                </ToggleButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      {films.length > 0 ? (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(112px, 13vw, 176px), 1fr))",
            gap: "clamp(0.85rem, 2vw, 1.45rem)",
          }}
        >
          {films.map((film, index) => (
            <FilmCard
              key={film.id}
              film={film}
              subtitle={subtitleFor(film)}
              eager={index < 8}
              imageSize={index < 8 ? "w342" : "w185"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-white/10 bg-white/[0.035] p-8 text-center">
          <p className="font-body text-white/58" style={{ fontSize: "clamp(0.85rem, 1.2vw, 1rem)" }}>
            No film credits found for this role yet.
          </p>
        </div>
      )}
    </section>
  );
};

const PersonContent = ({ personId }) => {
  const { data: person } = useSWR(`/person/${personId}`, fetcher, { suspense: true });
  const { data: credits } = useSWR(`/person/${personId}/movie_credits`, fetcher, { suspense: true });

  const groups = useMemo(
    () => groupCredits(credits, person?.known_for_department),
    [credits, person?.known_for_department]
  );
  const allFilms = useMemo(() => mergeAllCredits(groups), [groups]);
  const portraitSrc = profileUrl(person.profile_path, "h632") ?? "/fallback-image.jpg";
  const description = person.biography || `${person.name} biography, known films, and credits on CinemaScope.`;

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

      <section
        className="relative isolate overflow-hidden bg-base text-white"
        style={{
          paddingTop: "calc(var(--navbar-height, 3.5rem) + clamp(2rem, 4.5vw, 4rem))",
          paddingBottom: "clamp(3rem, 7vw, 6rem)",
        }}
      >
        <div className="absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(201,168,67,0.12),transparent_30%),radial-gradient(circle_at_90%_22%,rgba(255,255,255,0.06),transparent_24%)]" />
          <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/70 to-transparent" />
          <GrainOverlay />
        </div>

        <div className="center-container">
          <div className="person-page-grid">
            <ProfileRail person={person} totalCredits={allFilms.length} />
            <FilmographyPanel groups={groups} allFilms={allFilms} />
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
        <ErrorBoundary key={`person-${person_id}`}>
          <Suspense
            fallback={
              <section className="center-container" style={{ paddingTop: "calc(var(--navbar-height, 3.5rem) + 3rem)", paddingBottom: "4rem" }}>
                <PersonHeaderSkeleton />
                <div style={{ marginTop: "clamp(2rem, 5vw, 4rem)" }}>
                  <FilmGridSkeleton count={10} />
                </div>
              </section>
            }
          >
            <PersonContent personId={person_id} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default Person;
