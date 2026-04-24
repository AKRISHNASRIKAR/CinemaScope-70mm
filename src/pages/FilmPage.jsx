import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Footer from "@/components/layout/Footer";

const INITIAL_CAST = 8;
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 1.5, -1, 2.5, -3, 0.5];

const FilmPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const [certification, setCertification] = useState("N/A");
  const [cast, setCast] = useState([]);
  const [error, setError] = useState(null);
  const [showAllCast, setShowAllCast] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const API_KEY  = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchFilmData = async () => {
      try {
        const filmRes = await axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`);
        setFilm(filmRes.data);
        const certRes = await axios.get(`${BASE_URL}/movie/${id}/release_dates?api_key=${API_KEY}`);
        const us = certRes.data.results?.find((e) => e.iso_3166_1 === "US");
        setCertification(us?.release_dates?.[0]?.certification || "N/A");
        const creditsRes = await axios.get(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`);
        setCast(creditsRes.data.cast);
      } catch (e) {
        setError("Failed to load film details.");
      }
    };
    setShowAllCast(false);
    fetchFilmData();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-red-400 font-body" style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>{error}</p>
      </div>
    );
  }
  if (!film) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const backdrop = film.backdrop_path ? `https://image.tmdb.org/t/p/original${film.backdrop_path}` : null;
  const visibleCast = showAllCast ? cast : cast.slice(0, INITIAL_CAST);

  return (
    <div className="min-h-screen bg-base text-white">

      {/* ── TASK 2: Backdrop hero — object-position: top ─── */}
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(40vh, 55vh, 65vh)" }}>
        {backdrop && (
          <img
            src={backdrop}
            alt={film.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "top center" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "150px 150px",
          }}
        />
      </section>

      {/* ── Content ─── */}
      <div className="relative -mt-32 z-10 max-w-screen-xl mx-auto" style={{ padding: "0 clamp(1.5rem, 4vw, 4rem)" }}>
        <div className="flex flex-col md:flex-row" style={{ gap: "clamp(1.5rem, 4vw, 3rem)" }}>
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0" style={{ width: "clamp(180px, 25vw, 320px)" }}>
            <img
              src={film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : "/fallback-image-film.jpg"}
              alt={film.title}
              className="w-full rounded-card shadow-card-hover aspect-[2/3] object-cover"
            />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0" style={{ paddingTop: "clamp(1rem, 3vh, 2rem)" }}>
            <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: "clamp(1.8rem, 4vw, 3.5rem)" }}>{film.title}</h1>
            {film.tagline && (
              <p className="font-body italic text-muted mt-2" style={{ fontSize: "clamp(0.75rem, 1.2vw, 1rem)" }}>{film.tagline}</p>
            )}
            <div className="flex items-baseline mt-4" style={{ gap: "clamp(0.3rem, 0.6vw, 0.5rem)" }}>
              <span className="text-gold font-mono font-semibold" style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}>⭐ {film.vote_average ? film.vote_average.toFixed(1) : "N/A"}</span>
              <span className="font-mono text-muted" style={{ fontSize: "clamp(0.65rem, 1vw, 0.8rem)" }}>/ 10</span>
            </div>
            <div className="grid grid-cols-2 mt-6" style={{ gap: "clamp(0.5rem, 1.5vw, 1rem)" }}>
              {[
                ["Certification", certification],
                ["Release", film.release_date ? new Date(film.release_date).toDateString() : "N/A"],
                ["Runtime", film.runtime ? `${film.runtime} min` : "N/A"],
                ["Genres", film.genres?.map((g) => g.name).join(", ") || "N/A"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="font-body font-medium text-gold uppercase tracking-[0.12em]" style={{ fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)" }}>{label}</span>
                  <p className="font-body text-white/80 mt-0.5" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)" }}>{value}</p>
                </div>
              ))}
            </div>
            {film.overview && (
              <div className="mt-8">
                <h2 className="font-display font-bold text-gold" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>Overview</h2>
                <p className="font-body text-white/70 leading-relaxed mt-2" style={{ fontSize: "clamp(0.75rem, 1.1vw, 0.9rem)" }}>{film.overview}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TASK 1: Cast — Polaroid grid, expand/collapse
      ══════════════════════════════════════════════════════ */}
      {cast.length > 0 && (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12"
          style={{ marginTop: "clamp(2.5rem, 5vh, 4rem)", paddingBottom: "clamp(2rem, 4vh, 3rem)" }}
        >
          <div
            className="relative rounded-card overflow-hidden"
            style={{
              padding: "clamp(1.5rem, 3vw, 2.5rem)",
              background: "#0c0c0c",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
            }}
          >
            <h2
              className="font-display font-bold text-white text-center"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)", marginBottom: "clamp(1.5rem, 3vh, 2rem)" }}
            >
              Cast
            </h2>

            {/* Grid with transition */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center transition-all duration-slow overflow-hidden"
              style={{ gap: "clamp(1rem, 2vw, 1.5rem)" }}
            >
              {visibleCast.map((member, i) => {
                const rot = ROTATIONS[i % ROTATIONS.length];
                return (
                  <div
                    key={`${member.id}-${member.credit_id}`}
                    onClick={() => navigate(`/person/${member.id}`)}
                    className="cursor-pointer w-full max-w-[clamp(110px,14vw,160px)] mx-auto"
                    style={{
                      transform: `rotate(${rot}deg)`,
                      transition: "transform 200ms ease, box-shadow 200ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "rotate(0deg) translateY(-4px)";
                      e.currentTarget.style.boxShadow = "4px 6px 20px rgba(0,0,0,0.55)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${rot}deg)`;
                      e.currentTarget.style.boxShadow = "3px 4px 14px rgba(0,0,0,0.35)";
                    }}
                  >
                    <div
                      className="bg-white/95 flex flex-col"
                      style={{
                        padding: "clamp(6px, 0.8vw, 10px) clamp(6px, 0.8vw, 10px) clamp(18px, 2.5vw, 28px)",
                        boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
                        borderRadius: "2px",
                      }}
                    >
                      <img
                        src={member.profile_path ? `https://image.tmdb.org/t/p/w200${member.profile_path}` : "/fallback-image.jpg"}
                        alt={member.name}
                        className="w-full aspect-[3/4] object-cover object-top"
                        style={{ borderRadius: "1px" }}
                      />
                      <div style={{ paddingTop: "clamp(6px, 0.8vw, 10px)" }}>
                        <p
                          className="font-mono font-medium text-ink uppercase leading-tight line-clamp-1"
                          style={{ fontSize: "clamp(0.45rem, 0.7vw, 0.6rem)", letterSpacing: "0.08em" }}
                        >
                          {member.name}
                        </p>
                        {member.character && (
                          <p
                            className="font-body text-ink-muted leading-tight line-clamp-1"
                            style={{ fontSize: "clamp(0.4rem, 0.6vw, 0.5rem)", marginTop: "2px" }}
                          >
                            {member.character}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse button */}
            {cast.length > INITIAL_CAST && (
              <div className="flex justify-center" style={{ marginTop: "clamp(1.5rem, 3vh, 2rem)" }}>
                <button
                  onClick={() => setShowAllCast((v) => !v)}
                  className="
                    flex items-center gap-2
                    font-body font-medium uppercase tracking-[0.15em]
                    border border-gold/40 text-white/60
                    hover:bg-gold/10 hover:text-white hover:border-gold/70
                    transition-all duration-normal cursor-pointer
                    bg-transparent rounded-card
                  "
                  style={{
                    fontSize: "clamp(0.6rem, 0.9vw, 0.75rem)",
                    padding: "clamp(0.5rem, 1vh, 0.7rem) clamp(1.25rem, 2.5vw, 2rem)",
                  }}
                >
                  {showAllCast ? (
                    <>Show Less <KeyboardArrowUpIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)" }} /></>
                  ) : (
                    <>View Full Cast <KeyboardArrowDownIcon sx={{ fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)" }} /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FilmPage;
