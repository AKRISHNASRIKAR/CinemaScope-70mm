import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import Footer from "@/components/layout/Footer";

/* ── helpers ─────────────────────────────────────────────── */
const fmtDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
};

/* Skeleton card for loading state */
const SkeletonCard = () => (
  <div className="flex-shrink-0 animate-pulse" style={{ width: "clamp(100px, 12vw, 180px)" }}>
    <div className="aspect-[2/3] rounded-card bg-white/5" />
    <div className="h-3 rounded bg-white/5 mt-3 w-3/4" />
    <div className="h-2 rounded bg-white/5 mt-1.5 w-1/2" />
  </div>
);

/* ── page ────────────────────────────────────────────────── */
const Person = () => {
  const { person_id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson]       = useState(null);
  const [filmography, setFilmography] = useState([]);
  const [filmsLoading, setFilmsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const scrollRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_KEY  = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          axios.get(`${BASE_URL}/person/${person_id}?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/person/${person_id}/movie_credits?api_key=${API_KEY}&language=en-US`),
        ]);
        setPerson(pRes.data);
        // Sort by popularity descending, dedupe by id
        const seen = new Set();
        const sorted = (cRes.data.cast || [])
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
        setFilmography(sorted);
      } catch (e) {
        setError("Failed to load person details.");
      } finally {
        setFilmsLoading(false);
      }
    };
    fetchData();
  }, [person_id, BASE_URL, API_KEY]);

  /* ── scroll handlers ─── */
  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  /* ── states ─── */
  if (error) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <p className="text-red-400 font-body" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>{error}</p>
    </div>
  );

  if (!person) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const born = fmtDate(person.birthday);
  const died = fmtDate(person.deathday);
  const shortBio = person.biography
    ? person.biography.split(". ").slice(0, 3).join(". ") + "."
    : null;
  const fullBio = person.biography && person.biography.split(". ").length > 3
    ? person.biography.split(". ").slice(3, 6).join(". ") + "."
    : null;

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <div className="flex-1" style={{ paddingTop: "clamp(5rem, 10vh, 7rem)" }}>
        <div className="max-w-screen-xl mx-auto" style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>

          {/* ══════════════════════════════════════════════════
              TWO-COLUMN HEADER
          ══════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>

            {/* ── LEFT: Portrait + Birth/Death ─── */}
            <div className="sm:w-[38%] lg:w-[35%] flex-shrink-0">
              {/* Photo */}
              <div className="relative overflow-hidden" style={{ borderRadius: "8px" }}>
                <img
                  src={person.profile_path
                    ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
                    : "/fallback-image.jpg"
                  }
                  alt={person.name}
                  className="w-full aspect-[2/3] object-cover object-top sm:aspect-auto sm:h-auto"
                  style={{ maxHeight: "clamp(50vw, 60vh, 600px)" }}
                />
                {/* Bottom gradient fade into dark bg */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base to-transparent" />
              </div>

              {/* Birth / Death — desktop: below photo; mobile: moves below bio */}
              {born && (
                <div className="hidden sm:flex items-start mt-6" style={{ gap: "clamp(1rem, 2vw, 2rem)" }}>
                  {/* Born */}
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

                  {/* Dash + Died (if applicable) */}
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

            {/* ── RIGHT: Name + Bio + Biography ─── */}
            <div className="flex-1 min-w-0">
              {/* Department tag */}
              {person.known_for_department && (
                <p className="font-mono text-gold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)", marginBottom: "clamp(0.5rem, 1vh, 0.75rem)" }}>
                  {person.known_for_department}
                </p>
              )}

              {/* Name */}
              <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
                {person.name}
              </h1>

              {/* Short bio */}
              {shortBio && (
                <p className="font-body text-white/55 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)", marginTop: "clamp(1rem, 2vh, 1.5rem)" }}>
                  {shortBio}
                </p>
              )}

              {/* Biography section */}
              {fullBio && (
                <div style={{ marginTop: "clamp(1.5rem, 3vh, 2.5rem)" }}>
                  <div className="flex items-center" style={{ gap: "clamp(0.3rem, 0.6vw, 0.5rem)", marginBottom: "clamp(0.5rem, 1vh, 0.75rem)" }}>
                    <BookmarkIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", color: "#c9a843" }} />
                    <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)" }}>Biography</h2>
                  </div>
                  <p className="font-body text-white/40 leading-relaxed" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}>
                    {fullBio}
                  </p>
                </div>
              )}

              {/* Mobile-only: Birth/Death dates (inline) */}
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

          {/* ══════════════════════════════════════════════════
              KNOWN FOR — Full width filmography
          ══════════════════════════════════════════════════ */}
          <div style={{ marginTop: "clamp(2.5rem, 5vh, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}>
              <h2 className="font-display font-bold text-white tracking-tight" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}>
                Known For
              </h2>

              {/* Desktop arrows */}
              <div className="hidden sm:flex items-center" style={{ gap: "clamp(0.3rem, 0.5vw, 0.5rem)" }}>
                <button
                  onClick={() => scrollBy(-1)}
                  aria-label="Scroll left"
                  className="flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all duration-fast cursor-pointer"
                  style={{ width: "clamp(2rem, 3vw, 2.5rem)", height: "clamp(2rem, 3vw, 2.5rem)" }}
                >
                  <ChevronLeftIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.3rem)" }} />
                </button>
                <button
                  onClick={() => scrollBy(1)}
                  aria-label="Scroll right"
                  className="flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all duration-fast cursor-pointer"
                  style={{ width: "clamp(2rem, 3vw, 2.5rem)", height: "clamp(2rem, 3vw, 2.5rem)" }}
                >
                  <ChevronRightIcon sx={{ fontSize: "clamp(1rem, 1.5vw, 1.3rem)" }} />
                </button>
              </div>
            </div>

            {/* Scrollable poster row */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto scrollbar-hide pb-4"
              style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)", scrollBehavior: "smooth" }}
            >
              {filmsLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : filmography.slice(0, 20).map((film) => (
                    <div
                      key={film.id}
                      onClick={() => navigate(`/film/${film.id}`)}
                      className="flex-shrink-0 group cursor-pointer"
                      style={{ width: "clamp(100px, 12vw, 180px)" }}
                    >
                      <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-surface shadow-card">
                        <img
                          src={film.poster_path
                            ? `https://image.tmdb.org/t/p/w342${film.poster_path}`
                            : "/fallback-image-film.jpg"
                          }
                          alt={film.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-normal" />
                      </div>
                      <p
                        className="font-body font-medium line-clamp-1 group-hover:text-gold transition-colors duration-fast"
                        style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)", marginTop: "clamp(0.4rem, 0.7vh, 0.5rem)" }}
                      >
                        {film.title || "Untitled"}
                      </p>
                      {film.release_date && (
                        <p className="font-mono text-muted line-clamp-1" style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.6rem)", marginTop: "2px" }}>
                          {film.release_date.slice(0, 4)}
                        </p>
                      )}
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Person;
