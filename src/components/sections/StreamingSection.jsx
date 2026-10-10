import useSWR from "swr";

import InTheatersCarousel from "@/components/sections/InTheatersCarousel";
import { fetcher } from "@/lib/api/fetcher";

const StreamingSection = () => {
  const { data } = useSWR(
    "/discover/movie?sort_by=popularity.desc&watch_region=US&with_watch_monetization_types=flatrate",
    fetcher,
    { suspense: true }
  );
  const films = (data?.results ?? [])
    .filter((film) => film.backdrop_path || film.poster_path)
    .slice(0, 12);

  if (!films.length) return null;

  return (
    <section className="w-full bg-section-dark text-white" style={{ padding: "clamp(2rem, 5vw, 4.5rem) 0" }}>
      <div className="center-container">
        <InTheatersCarousel
          films={films}
          isDark
          title="STREAMING"
          badgeLabel="WATCH AT HOME"
          ariaLabel="Streaming films carousel"
          scrollLabel="streaming films"
        />
        <p
          className="font-mono uppercase text-white/35"
          style={{ marginTop: "0.75rem", fontSize: "clamp(0.48rem, 0.8vw, 0.6rem)", letterSpacing: "0.16em" }}
        >
          Streaming availability data powered by JustWatch.
        </p>
      </div>
    </section>
  );
};

export default StreamingSection;
