import React, { Suspense, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BookmarkIcon from "@mui/icons-material/Bookmark";

import Footer from "@/components/layout/Footer";
import LazyImage from "@/components/ui/LazyImage";
import BackButton from "@/components/ui/BackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { PersonHeaderSkeleton, FilmRowSkeleton } from "@/components/ui/Skeletons";

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
  
  const displayBio = isLongBio && !isBioExpanded 
    ? bioText.slice(0, 400) + "..." 
    : bioText;

  return (
    <div className="flex flex-col sm:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>
      {/* LEFT: Portrait */}
      <div className="sm:w-[38%] lg:w-[35%] flex-shrink-0">
        <div className="relative overflow-hidden" style={{ borderRadius: "8px" }}>
          <LazyImage
            src={person.profile_path ? `https://image.tmdb.org/t/p/h632${person.profile_path}` : null}
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
              <BookmarkIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", color: "#c9a843" }} />
              <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)" }}>Biography</h2>
            </div>
            <div className="font-body text-white/55 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
              {displayBio.split("\n").map((para, i) => para.trim() && <p key={i} className="mb-3">{para}</p>)}
              {isLongBio && (
                <button 
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
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
  );
};

/* ── 2. Filmography Row (Data-driven) ────────────────────────── */
const FilmographyRow = ({ person_id }) => {
  const { data: credits } = useSWR(`/person/${person_id}/movie_credits`, fetcher, { suspense: true });
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const seen = new Set();
  const filmography = (credits.cast || [])
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
    .slice(0, 20);

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  if (filmography.length === 0) return null;

  return (
    <div style={{ marginTop: "clamp(2.5rem, 5vh, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>
        <h2 className="font-display font-bold text-white tracking-tight" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}>
          Known For
        </h2>

        {filmography.length > 5 && (
          <div className="hidden sm:flex items-center" style={{ gap: "clamp(0.3rem, 0.5vw, 0.5rem)" }}>
            <button onClick={() => scrollBy(-1)} className="flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all duration-fast cursor-pointer w-10 h-10">
              <ChevronLeftIcon />
            </button>
            <button onClick={() => scrollBy(1)} className="flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all duration-fast cursor-pointer w-10 h-10">
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide pb-4" style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)", scrollBehavior: "smooth" }}>
        {filmography.map((film) => (
          <div key={film.id} onClick={() => navigate(`/film/${film.id}`)} className="flex-shrink-0 group cursor-pointer" style={{ width: "clamp(100px, 12vw, 180px)" }}>
            <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
              <LazyImage
                src={film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null}
                alt={film.title}
                fallbackType="poster"
                className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-normal" />
            </div>
            <p className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast mt-2" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>
              {film.title || "Untitled"}
            </p>
            {film.release_date && (
              <p className="font-mono text-muted line-clamp-1 text-[10px] mt-1">
                {film.release_date.slice(0, 4)}
              </p>
            )}
          </div>
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
      <div className="flex-1 center-container px-4 sm:px-6 lg:px-12" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        
        <div className="mb-8">
          <BackButton fallbackRoute="/" label="Back to Films" />
        </div>

        {/* Header Section */}
        <ErrorBoundary>
          <Suspense fallback={<PersonHeaderSkeleton />}>
            <PersonHeader person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

        {/* Filmography Row */}
        <ErrorBoundary>
          <Suspense fallback={<FilmRowSkeleton count={6} />}>
            <FilmographyRow person_id={person_id} />
          </Suspense>
        </ErrorBoundary>

      </div>
      <Footer />
    </div>
  );
};

export default Person;
