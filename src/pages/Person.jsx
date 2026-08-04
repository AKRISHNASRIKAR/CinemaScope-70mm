import React, { Suspense, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import BookmarkIcon from "@mui/icons-material/Bookmark";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import FilmCard from "@/components/ui/FilmCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { PersonHeaderSkeleton, FilmGridSkeleton } from "@/components/ui/Skeletons";
import { profileUrl } from "@/lib/utils/tmdbImage";

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
};

/* ── Small labelled fact ─────────────────────────────────── */
const Fact = ({ label, value, sub, accent = false }) => (
  <div style={{ minWidth: 0 }}>
    <span
      className="font-mono text-muted uppercase"
      style={{ fontSize: "clamp(0.45rem, 0.75vw, 0.6rem)", letterSpacing: "0.22em" }}
    >
      {label}
    </span>
    <p
      className={`font-display font-bold leading-none ${accent ? "text-gold" : "text-white/85"}`}
      style={{ fontSize: "clamp(0.95rem, 1.9vw, 1.5rem)", marginTop: "clamp(0.15rem, 0.4vh, 0.3rem)" }}
    >
      {value}
    </p>
    {sub && (
      <p
        className="font-body text-muted leading-snug"
        style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.7rem)", marginTop: "0.15rem" }}
      >
        {sub}
      </p>
    )}
  </div>
);

/* ── 1. Person Header (Data-driven) ────────────────────────────── */
const PersonHeader = ({ person_id }) => {
  const { data: person } = useSWR(`/person/${person_id}`, fetcher, { suspense: true });
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const born = fmtDate(person.birthday);
  const died = fmtDate(person.deathday);

  const bioText = person.biography || "";
  const isLongBio = bioText.length > 400;
  const displayBio = isLongBio && !isBioExpanded ? bioText.slice(0, 400) + "…" : bioText;

  const ambient = profileUrl(person.profile_path, "original");

  return (
    <>
      {/* ── Ambient full-bleed backdrop derived from the portrait ── */}
      {ambient && (
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 pointer-events-none overflow-hidden"
          style={{ height: "clamp(320px, 55vh, 640px)" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${ambient})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
              filter: "blur(48px) saturate(1.25)",
              transform: "scale(1.2)",
              opacity: 0.45,
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(9,9,9,0.45) 0%, rgba(9,9,9,0.78) 55%, #090909 100%)" }}
          />
        </div>
      )}

      <div className="relative flex flex-wrap items-start" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>
        {/* LEFT: Portrait */}
        {/* Grows to fill the row when it wraps onto its own line on small screens */}
        <div style={{ flex: "1 1 clamp(200px, 30vw, 340px)", maxWidth: "340px", minWidth: 0 }}>
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.75)" }}
          >
            <LazyImage
              src={profileUrl(person.profile_path, "h632")}
              alt={person.name}
              fallbackType="person"
              eager={true}
              fetchpriority="high"
              className="w-full aspect-[2/3] object-cover object-top"
            />
          </div>
        </div>

        {/* RIGHT: Identity + bio */}
        <div style={{ flex: "1 1 clamp(280px, 45vw, 640px)", minWidth: 0 }}>
          {person.known_for_department && (
            <p
              className="font-mono text-gold uppercase"
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.68rem)", letterSpacing: "0.32em", marginBottom: "clamp(0.4rem, 1vh, 0.7rem)" }}
            >
              {person.known_for_department}
            </p>
          )}

          <h1
            className="font-display font-bold text-white leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(1.8rem, 5vw, 4rem)" }}
          >
            {person.name}
          </h1>

          {/* Facts row — one layout at every width */}
          {(born || person.place_of_birth) && (
            <div
              className="flex flex-wrap items-start"
              style={{ gap: "clamp(1rem, 3vw, 2.5rem)", marginTop: "clamp(1rem, 2.5vh, 1.75rem)" }}
            >
              {born && (
                <Fact
                  label="Born"
                  accent
                  value={`${born.day} ${born.month} ${born.year}`}
                  sub={person.place_of_birth}
                />
              )}
              {died && <Fact label="Died" value={`${died.day} ${died.month} ${died.year}`} />}
              {person.popularity > 0 && (
                <Fact label="Popularity" value={person.popularity.toFixed(0)} />
              )}
            </div>
          )}

          {bioText && (
            <div style={{ marginTop: "clamp(1.5rem, 3vh, 2.5rem)" }}>
              <div
                className="flex items-center"
                style={{ gap: "clamp(0.3rem, 0.6vw, 0.5rem)", marginBottom: "clamp(0.5rem, 1vh, 0.75rem)" }}
              >
                <BookmarkIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", color: "#c9a843" }} />
                <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)" }}>
                  Biography
                </h2>
              </div>
              <div
                className="font-body text-white/60 leading-relaxed"
                style={{ fontSize: "clamp(0.78rem, 1.3vw, 0.95rem)", maxWidth: "72ch" }}
              >
                {displayBio.split("\n").map((para, i) => para.trim() && <p key={i} className="mb-3">{para}</p>)}
                {isLongBio && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-gold hover:text-gold-lt transition-colors font-medium cursor-pointer"
                    style={{ fontSize: "inherit" }}
                  >
                    {isBioExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── 2. Filmography Grid (Data-driven) ───────────────────────── */
const FilmographyGrid = ({ person_id }) => {
  const { data: credits } = useSWR(`/person/${person_id}/movie_credits`, fetcher, { suspense: true });

  const seen = new Set();
  const filmography = (credits.cast || [])
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
    .slice(0, 18);

  if (filmography.length === 0) return null;

  return (
    <div style={{ marginTop: "clamp(2.5rem, 5vh, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}>
      <div
        className="flex items-baseline border-b border-white/[0.08]"
        style={{ gap: "0.6rem", paddingBottom: "clamp(0.5rem,1vh,0.75rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}
      >
        <h2
          className="font-display font-bold text-white tracking-tight"
          style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}
        >
          Known For
        </h2>
        <span className="font-mono text-muted" style={{ fontSize: "clamp(0.55rem, 0.85vw, 0.7rem)" }}>
          {filmography.length} films
        </span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(120px, 15vw, 190px), 1fr))",
          gap: "clamp(0.75rem, 2vw, 1.5rem)",
        }}
      >
        {filmography.map((film) => (
          <FilmCard
            key={film.id}
            film={film}
            subtitle={film.character || (film.release_date ? film.release_date.slice(0, 4) : undefined)}
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
    <div className="relative min-h-screen bg-base text-white flex flex-col overflow-hidden">
      <BackButton fallbackRoute="/" />
      {/* Not `relative` on purpose — the ambient backdrop inside PersonHeader
          positions against the page root so it can bleed edge to edge. */}
      <div className="flex-1 center-container" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>

        {/* Header Section */}
        <ErrorBoundary>
          <Suspense fallback={<PersonHeaderSkeleton />}>
            <PersonHeader person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

        {/* Filmography */}
        <ErrorBoundary>
          <Suspense fallback={<FilmGridSkeleton count={10} />}>
            <FilmographyGrid person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

      </div>
      <Footer />
    </div>
  );
};

export default Person;
