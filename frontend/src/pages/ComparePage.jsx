import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";
import LazyImage from "@/components/ui/LazyImage";
import SEO from "@/components/seo/SEO";
import { posterUrl } from "@/lib/utils/tmdbImage";
import { useMovieSearch } from "@/hooks/useMovieSearch";

const formatNumber = (value) => (Number.isFinite(value) && value > 0 ? value.toLocaleString("en-US") : "—");
const formatMoney = (value) =>
  Number.isFinite(value) && value > 0
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value)
    : "—";
const formatRuntime = (value) => {
  if (!value) return "—";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};
const formatYear = (date) => (date ? date.slice(0, 4) : "—");
const formatGenres = (film) => film?.genres?.map((genre) => genre.name).join(", ") || "—";
const getTitle = (film) => film?.title || film?.name || "Untitled";

const getWinner = (left, right, mode = "higher") => {
  if (!Number.isFinite(left) || !Number.isFinite(right) || left === right) return null;
  return mode === "lower" ? (left < right ? "left" : "right") : left > right ? "left" : "right";
};

const FilmSearch = ({ onSelect, placeholder = "Search a film..." }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const { results, isLoading } = useMovieSearch(query, { limit: 7, delay: 280 });

  useEffect(() => {
    setActiveIndex(results.length ? 0 : -1);
  }, [results]);

  const pick = useCallback(
    (film) => {
      onSelect(film);
      setQuery("");
      setActiveIndex(-1);
    },
    [onSelect]
  );

  const clear = useCallback(() => {
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        clear();
        return;
      }
      if (!results.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % results.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        pick(results[activeIndex]);
      }
    },
    [activeIndex, clear, pick, results]
  );

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon
          sx={{ fontSize: "clamp(0.9rem,1.4vw,1.08rem)" }}
          className="pointer-events-none absolute left-3 text-white/32"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-card border border-white/10 bg-black/30 font-body text-white outline-none transition-all duration-normal placeholder:text-white/28 focus:border-gold/45 focus:bg-black/45 focus:ring-1 focus:ring-gold/25"
          style={{ padding: "0.72rem 2.65rem 0.72rem 2.35rem", fontSize: "clamp(0.78rem,1.05vw,0.9rem)" }}
          aria-label={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-controls={results.length > 0 ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${results[activeIndex]?.id}` : undefined}
          aria-busy={isLoading}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 rounded-full text-white/34 transition-colors duration-fast hover:text-white focus-ring cursor-pointer"
            aria-label="Clear search"
          >
            <CloseIcon sx={{ fontSize: "1rem" }} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div
          id={listboxId}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-white/10 bg-elevated shadow-card-hover"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((film, index) => (
            <button
              type="button"
              key={film.id}
              id={`${listboxId}-${film.id}`}
              onClick={() => pick(film)}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-fast hover:bg-white/[0.06] focus-ring cursor-pointer ${
                index === activeIndex ? "bg-white/[0.07]" : ""
              }`}
            >
              <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-surface">
                {film.poster_path ? (
                  <img
                    src={posterUrl(film.poster_path, "w92")}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-body font-medium text-white" style={{ fontSize: "clamp(0.76rem,1vw,0.88rem)" }}>
                  {getTitle(film)}
                </p>
                <p className="mt-0.5 font-mono text-muted" style={{ fontSize: "0.62rem" }}>
                  {formatYear(film.release_date)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && query.trim() && (
        <p className="absolute left-0 top-full mt-2 font-body text-muted" style={{ fontSize: "0.75rem" }}>
          Searching...
        </p>
      )}
    </div>
  );
};

const FilmSkeleton = () => (
  <div className="rounded-card border border-white/10 bg-white/[0.025] p-3">
    <div className="aspect-[2/3] rounded-card skeleton" />
    <div className="mt-4 h-5 w-3/4 rounded skeleton" />
    <div className="mt-2 h-3 w-1/2 rounded skeleton" />
  </div>
);

const EmptySlot = ({ label, eyebrow, onSelect }) => (
  <div className="rounded-card border border-dashed border-white/14 bg-white/[0.025] p-3">
    <div
      className="flex aspect-[2/3] flex-col items-center justify-center rounded-card bg-black/25 text-center"
      style={{ gap: "0.85rem", padding: "clamp(1rem, 3vw, 1.5rem)" }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/38">
        <AddIcon sx={{ fontSize: "1.2rem" }} />
      </div>
      <div>
        <p className="font-mono uppercase text-gold" style={{ fontSize: "0.58rem", letterSpacing: "0.2em" }}>
          {eyebrow}
        </p>
        <p className="mt-2 font-body text-white/55" style={{ fontSize: "clamp(0.78rem,1vw,0.9rem)" }}>
          Search for a film to compare.
        </p>
      </div>
    </div>
    <div className="mt-3">
      <FilmSearch onSelect={(film) => onSelect(film.id)} placeholder={label} />
    </div>
  </div>
);

const ErrorSlot = ({ label, onClear }) => (
  <div className="rounded-card border border-red-400/20 bg-red-400/[0.04] p-5">
    <div className="flex items-start gap-3">
      <ErrorOutlineIcon sx={{ fontSize: "1.15rem", color: "rgb(248 113 113)", flexShrink: 0 }} />
      <div className="min-w-0">
        <p className="font-body font-semibold text-white">{label}</p>
        <p className="mt-1 font-body text-white/55" style={{ fontSize: "0.82rem" }}>
          This film could not be loaded. Try picking another title.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-full border border-white/10 px-4 py-2 font-body text-white/68 transition-colors duration-fast hover:border-white/25 hover:text-white focus-ring cursor-pointer"
          style={{ fontSize: "0.78rem" }}
        >
          Clear slot
        </button>
      </div>
    </div>
  </div>
);

const FilmPosterPanel = ({ film, side, isLoading, error, onSelect, onClear }) => {
  const navigate = useNavigate();

  if (isLoading) return <FilmSkeleton />;
  if (error) return <ErrorSlot label={`${side} failed`} onClear={onClear} />;
  if (!film) return <EmptySlot eyebrow={side} label={`Search ${side.toLowerCase()}...`} onSelect={onSelect} />;

  const poster = posterUrl(film.poster_path, "w500") ?? "/fallback-image-film.jpg";
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "—";

  return (
    <article className="group min-w-0 rounded-card border border-white/10 bg-white/[0.035] p-3 transition-colors duration-normal hover:border-white/18">
      <div className="relative overflow-hidden rounded-card bg-surface shadow-card-hover">
        <div className="aspect-[2/3]">
          <LazyImage
            src={poster}
            alt={`${getTitle(film)} poster`}
            fallbackType="poster"
            eager={true}
            fetchPriority="high"
            className="poster-image h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent p-4">
          <p className="font-mono uppercase text-gold" style={{ fontSize: "0.58rem", letterSpacing: "0.2em" }}>
            {formatYear(film.release_date)}
          </p>
          <h2 className="mt-1 line-clamp-2 font-wordmark font-black uppercase text-white" style={{ fontSize: "clamp(1.3rem,3vw,2.35rem)", lineHeight: 0.9 }}>
            {getTitle(film)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${getTitle(film)}`}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/62 opacity-100 transition-all duration-fast hover:bg-black/85 hover:text-white focus-ring cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
        >
          <CloseIcon sx={{ fontSize: "1rem" }} />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {film.tagline && (
            <p className="line-clamp-2 font-body italic text-white/50" style={{ fontSize: "clamp(0.72rem,1vw,0.86rem)" }}>
              {film.tagline}
            </p>
          )}
          <p className="mt-2 line-clamp-3 font-body text-white/56" style={{ fontSize: "clamp(0.72rem,1vw,0.86rem)" }}>
            {film.overview || "No overview available."}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-center rounded-card border border-gold/25 bg-gold/10 px-3 py-2 text-gold">
          <span className="font-wordmark font-black" style={{ fontSize: "1.28rem", lineHeight: 1 }}>
            {rating}
          </span>
          <span className="font-mono uppercase text-gold/70" style={{ fontSize: "0.48rem", letterSpacing: "0.12em" }}>
            TMDB
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilmSearch onSelect={(nextFilm) => onSelect(nextFilm.id)} placeholder={`Replace ${side.toLowerCase()}...`} />
        <button
          type="button"
          onClick={() => navigate(`/film/${film.id}`)}
          className="flex flex-shrink-0 items-center gap-2 rounded-full border border-gold/30 px-4 py-2 font-body font-semibold text-gold transition-all duration-normal hover:border-gold/60 hover:bg-gold/10 focus-ring cursor-pointer"
          style={{ fontSize: "0.78rem" }}
        >
          Open <OpenInNewIcon sx={{ fontSize: "0.9rem" }} />
        </button>
      </div>
    </article>
  );
};

const MetricValue = ({ value, winner }) => (
  <span
    className={`block rounded-card border px-3 py-2 text-right font-body transition-colors duration-normal ${
      winner ? "border-gold/35 bg-gold/10 text-gold" : "border-white/8 bg-white/[0.025] text-white/76"
    }`}
    style={{ fontSize: "clamp(0.76rem,1vw,0.9rem)" }}
  >
    {value}
  </span>
);

const ComparisonRow = ({ label, left, right, winner }) => (
  <div className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-white/8 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] sm:items-center">
    <MetricValue value={left} winner={winner === "left"} />
    <p className="order-first font-mono uppercase text-white/38 sm:order-none sm:text-center" style={{ fontSize: "0.58rem", letterSpacing: "0.18em" }}>
      {label}
    </p>
    <MetricValue value={right} winner={winner === "right"} />
  </div>
);

const ComparisonMatrix = ({ filmA, filmB }) => {
  if (!filmA || !filmB) return null;

  const rows = [
    {
      label: "Rating",
      left: filmA.vote_average ? `${filmA.vote_average.toFixed(1)} / 10` : "—",
      right: filmB.vote_average ? `${filmB.vote_average.toFixed(1)} / 10` : "—",
      winner: getWinner(filmA.vote_average, filmB.vote_average),
    },
    {
      label: "Votes",
      left: formatNumber(filmA.vote_count),
      right: formatNumber(filmB.vote_count),
      winner: getWinner(filmA.vote_count, filmB.vote_count),
    },
    {
      label: "Runtime",
      left: formatRuntime(filmA.runtime),
      right: formatRuntime(filmB.runtime),
      winner: getWinner(filmA.runtime, filmB.runtime, "lower"),
    },
    {
      label: "Release",
      left: formatYear(filmA.release_date),
      right: formatYear(filmB.release_date),
    },
    {
      label: "Budget",
      left: formatMoney(filmA.budget),
      right: formatMoney(filmB.budget),
      winner: getWinner(filmA.budget, filmB.budget),
    },
    {
      label: "Revenue",
      left: formatMoney(filmA.revenue),
      right: formatMoney(filmB.revenue),
      winner: getWinner(filmA.revenue, filmB.revenue),
    },
    {
      label: "Genres",
      left: formatGenres(filmA),
      right: formatGenres(filmB),
    },
    {
      label: "Status",
      left: filmA.status || "—",
      right: filmB.status || "—",
    },
  ];

  return (
    <section className="rounded-card border border-white/10 bg-white/[0.025] p-4 sm:p-5" aria-labelledby="comparison-matrix-heading">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono uppercase text-gold" style={{ fontSize: "0.58rem", letterSpacing: "0.22em" }}>
            Breakdown
          </p>
          <h2 id="comparison-matrix-heading" className="mt-1 font-wordmark font-black uppercase text-white" style={{ fontSize: "clamp(1.55rem,3vw,2.55rem)", lineHeight: 0.9 }}>
            Side by side
          </h2>
        </div>
        <p className="font-body text-white/45" style={{ fontSize: "clamp(0.72rem,1vw,0.84rem)" }}>
          Gold highlights the stronger numeric value.
        </p>
      </div>
      <div>
        {rows.map((row) => (
          <ComparisonRow key={row.label} {...row} />
        ))}
      </div>
    </section>
  );
};

const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idA = searchParams.get("a") || "";
  const idB = searchParams.get("b") || "";

  const { data: filmA, error: errorA, isLoading: isLoadingA } = useSWR(idA ? `/movie/${idA}` : null, fetcher);
  const { data: filmB, error: errorB, isLoading: isLoadingB } = useSWR(idB ? `/movie/${idB}` : null, fetcher);

  const setId = useCallback(
    (key, id) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set(key, id);
      else next.delete(key);
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const swap = useCallback(() => {
    const next = new URLSearchParams();
    if (idB) next.set("a", idB);
    if (idA) next.set("b", idA);
    setSearchParams(next);
  }, [idA, idB, setSearchParams]);

  const pageTitle = useMemo(() => {
    if (filmA && filmB) return `${getTitle(filmA)} vs ${getTitle(filmB)}`;
    return "Film Comparison";
  }, [filmA, filmB]);

  const hasBoth = Boolean(idA && idB);

  return (
    <div className="min-h-screen bg-base text-white flex flex-col">
      <SEO
        title={pageTitle}
        description="Compare two films side by side by rating, runtime, release year, budget, revenue, genres, posters, and overview."
        canonicalPath={`/compare${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
      />
      <BackButton fallbackRoute="/" />

      <section
        className="relative isolate flex-1 overflow-hidden"
        style={{ paddingTop: "calc(var(--navbar-height, 3.5rem) + clamp(2.2rem, 5vw, 4.4rem))", paddingBottom: "clamp(3rem, 7vw, 5rem)" }}
      >
        <div className="absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(201,168,67,0.13),transparent_30%),radial-gradient(circle_at_84%_6%,rgba(255,255,255,0.07),transparent_24%)]" />
          <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/78 to-transparent" />
        </div>

        <div className="center-container">
          <header className="border-y border-white/10" style={{ padding: "clamp(1rem, 2.4vw, 1.55rem) 0" }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="font-mono uppercase text-gold" style={{ fontSize: "clamp(0.52rem,0.82vw,0.64rem)", letterSpacing: "0.28em" }}>
                  Compare
                </p>
                <h1 className="mt-2 font-wordmark font-black uppercase text-white" style={{ fontSize: "clamp(2.35rem,6.6vw,6.25rem)", lineHeight: 0.84, letterSpacing: "-0.055em" }}>
                  Film Lab
                </h1>
              </div>

              <div className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
                <FilmSearch onSelect={(film) => setId("a", film.id)} placeholder={filmA ? `Replace ${getTitle(filmA)}...` : "Search film A..."} />
                <FilmSearch onSelect={(film) => setId("b", film.id)} placeholder={filmB ? `Replace ${getTitle(filmB)}...` : "Search film B..."} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="font-body text-white/48" style={{ fontSize: "clamp(0.76rem,1.05vw,0.9rem)" }}>
                Pick two films and compare the numbers, texture, and basic metadata without leaving the page.
              </p>
              <div className="flex flex-shrink-0 items-center gap-2 rounded-full border border-white/8 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={swap}
                  disabled={!idA && !idB}
                  className="flex items-center gap-2 rounded-full px-4 py-2 font-body font-semibold text-white/62 transition-all duration-normal hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-35 focus-ring cursor-pointer"
                  style={{ fontSize: "0.78rem" }}
                >
                  <SwapHorizIcon sx={{ fontSize: "1rem" }} /> Swap
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!idA && !idB}
                  className="rounded-full px-4 py-2 font-body font-semibold text-white/50 transition-all duration-normal hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-35 focus-ring cursor-pointer"
                  style={{ fontSize: "0.78rem" }}
                >
                  Clear
                </button>
              </div>
            </div>
          </header>

          <section className="relative" style={{ marginTop: "clamp(1.4rem, 3vw, 2rem)" }} aria-label="Selected films">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start">
              <FilmPosterPanel
                side="Film A"
                film={filmA}
                isLoading={isLoadingA}
                error={errorA}
                onSelect={(id) => setId("a", id)}
                onClear={() => setId("a", "")}
              />

              <div className="flex justify-center md:pt-[min(26vw,18rem)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-gold shadow-card">
                  VS
                </div>
              </div>

              <FilmPosterPanel
                side="Film B"
                film={filmB}
                isLoading={isLoadingB}
                error={errorB}
                onSelect={(id) => setId("b", id)}
                onClear={() => setId("b", "")}
              />
            </div>
          </section>

          {hasBoth && (
            <div style={{ marginTop: "clamp(1.5rem, 3.5vw, 2.5rem)" }}>
              <ComparisonMatrix filmA={filmA} filmB={filmB} />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComparePage;
