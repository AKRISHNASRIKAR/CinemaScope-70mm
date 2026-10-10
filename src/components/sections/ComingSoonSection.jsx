import useSWR from "swr";

import FilmCard from "@/components/ui/FilmCard";
import ScrollRow from "@/components/ui/ScrollRow";
import { fetcher } from "@/lib/api/fetcher";
import { monthYear } from "@/lib/utils/formatDate";

const RELEASE_TYPE_THEATRICAL = "2%7C3";

const iso = (date) => date.toISOString().slice(0, 10);
const today = () => iso(new Date());
const monthsAhead = (count) => {
  const date = new Date();
  date.setMonth(date.getMonth() + count);
  return iso(date);
};

const sortByReleaseDate = (a, b) => {
  const first = a.release_date ? new Date(a.release_date).getTime() : Number.MAX_SAFE_INTEGER;
  const second = b.release_date ? new Date(b.release_date).getTime() : Number.MAX_SAFE_INTEGER;
  return first - second;
};

const ComingSoonSection = () => {
  const endpoint = (
    `/discover/movie?sort_by=popularity.desc&region=US&with_release_type=${RELEASE_TYPE_THEATRICAL}` +
    `&primary_release_date.gte=${today()}&primary_release_date.lte=${monthsAhead(8)}`
  );
  const { data } = useSWR(endpoint, fetcher, { suspense: true });
  const films = (data?.results ?? [])
    .filter((film) => film.poster_path && film.release_date >= today())
    .sort(sortByReleaseDate)
    .slice(0, 12);

  if (!films.length) return null;

  return (
    <section className="w-full bg-base text-white" style={{ padding: "clamp(2rem, 5vw, 4rem) 0" }}>
      <div className="center-container">
        <div
          className="flex flex-wrap items-start"
          style={{ gap: "clamp(1rem, 3vw, 2.4rem)" }}
        >
          <div style={{ flex: "0 1 clamp(8.5rem, 16vw, 12.5rem)", minWidth: "8.5rem" }}>
            <p
              className="font-mono uppercase text-gold"
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.66rem)", letterSpacing: "0.3em", marginBottom: "0.55rem" }}
            >
              Release Slate
            </p>
            <h2
              className="font-wordmark font-black uppercase leading-[0.86]"
              style={{ fontSize: "clamp(1.55rem, 3.4vw, 3.25rem)", letterSpacing: "-0.05em" }}
            >
              Coming Soon
            </h2>
            <p
              className="font-body text-white/45"
              style={{ marginTop: "clamp(0.6rem, 1.4vw, 0.9rem)", fontSize: "clamp(0.7rem, 1vw, 0.86rem)" }}
            >
              Upcoming US releases in a lighter, quicker scan.
            </p>
          </div>

          <div style={{ flex: "1 1 clamp(18rem, 68vw, 68rem)", minWidth: 0 }}>
            <ScrollRow
              showArrows={films.length > 5}
              scrollAmount={360}
              gap="clamp(0.75rem, 1.5vw, 1.15rem)"
              arrowSize="2.25rem"
              ariaLabel="Coming soon films"
            >
              {films.map((film) => (
                <div
                  key={film.id}
                  className="flex-shrink-0"
                  style={{ width: "clamp(104px, 12vw, 162px)", scrollSnapAlign: "start" }}
                >
                  <FilmCard film={film} subtitle={monthYear(film.release_date)} />
                </div>
              ))}
            </ScrollRow>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
