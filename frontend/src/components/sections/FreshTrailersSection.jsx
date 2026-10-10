import { useMemo } from "react";
import useSWR from "swr";

import InTheatersCarousel from "@/components/sections/InTheatersCarousel";
import { fetcher, parallelFetcher } from "@/lib/api/fetcher";

const RELEASE_TYPE_THEATRICAL = "2%7C3";

const iso = (date) => date.toISOString().slice(0, 10);
const today = () => iso(new Date());
const monthsAhead = (count) => {
  const date = new Date();
  date.setMonth(date.getMonth() + count);
  return iso(date);
};

const pickTrailer = (videos = []) =>
  videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
  videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
  videos.find((video) => video.site === "YouTube");

const FreshTrailersSection = () => {
  const endpoint = (
    `/discover/movie?sort_by=popularity.desc&region=US&with_release_type=${RELEASE_TYPE_THEATRICAL}` +
    `&primary_release_date.gte=${today()}&primary_release_date.lte=${monthsAhead(8)}`
  );
  const { data } = useSWR(endpoint, fetcher, { suspense: true });
  const candidates = useMemo(
    () => (data?.results ?? [])
      .filter((film) => film.release_date >= today() && (film.backdrop_path || film.poster_path))
      .slice(0, 12),
    [data]
  );

  const { data: videoResponses = [] } = useSWR(
    candidates.length ? candidates.map((film) => `/movie/${film.id}/videos`) : null,
    parallelFetcher,
    { suspense: true }
  );

  const films = useMemo(
    () => candidates
      .map((film, index) => {
        const trailer = pickTrailer(videoResponses[index]?.results);
        return trailer ? { ...film, trailerKey: trailer.key } : null;
      })
      .filter(Boolean)
      .slice(0, 8),
    [candidates, videoResponses]
  );

  if (!films.length) return null;

  return (
    <section className="w-full bg-section-light text-ink" style={{ padding: "clamp(2rem, 5vw, 4.5rem) 0" }}>
      <div className="center-container">
        <InTheatersCarousel
          films={films}
          isDark={false}
          title="FRESH TRAILERS"
          badgeLabel="TRAILER"
          ariaLabel="Fresh trailers carousel"
          scrollLabel="fresh trailers"
          external
          getHref={(film) => `https://www.youtube.com/watch?v=${film.trailerKey}`}
          getAriaLabel={(film) => `Watch trailer for ${film.title || film.name}`}
        />
      </div>
    </section>
  );
};

export default FreshTrailersSection;
