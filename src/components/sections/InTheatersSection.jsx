import useSWR from "swr";

import InTheatersCarousel from "@/components/sections/InTheatersCarousel";
import { fetcher } from "@/lib/api/fetcher";

const InTheatersSection = () => {
  const { data } = useSWR("/movie/now_playing?page=1&region=US", fetcher, { suspense: true });
  const films = (data?.results ?? [])
    .filter((film) => film.backdrop_path || film.poster_path)
    .slice(0, 12);

  return (
    <section
      className="w-full bg-section-light text-ink"
      style={{ padding: "clamp(2rem, 5vw, 4.5rem) 0 clamp(1.75rem, 4vw, 3.75rem)" }}
    >
      <div className="center-container">
        <InTheatersCarousel films={films} isDark={false} />
      </div>
    </section>
  );
};

export default InTheatersSection;
