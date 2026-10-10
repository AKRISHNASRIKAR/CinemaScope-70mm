import { Link } from "react-router-dom";
import useSWR from "swr";

import LazyImage from "@/components/ui/LazyImage";
import ScrollRow from "@/components/ui/ScrollRow";
import { fetcher } from "@/lib/api/fetcher";
import { profileUrl } from "@/lib/utils/tmdbImage";

const knownFor = (person) =>
  (person.known_for ?? [])
    .map((item) => item.title || item.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");

const PeopleInFocusSection = () => {
  const { data } = useSWR("/person/popular?page=1", fetcher, { suspense: true });
  const people = (data?.results ?? []).filter((person) => person.profile_path).slice(0, 12);

  if (!people.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-section-dark text-white" style={{ padding: "clamp(2.5rem, 6vw, 5rem) 0" }}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="center-container relative">
        <div
          className="flex flex-wrap items-end justify-between border-y border-white/10"
          style={{ gap: "clamp(1rem, 3vw, 2rem)", padding: "clamp(0.9rem, 2vw, 1.3rem) 0", marginBottom: "clamp(1.25rem, 3vw, 2rem)" }}
        >
          <div>
            <p
              className="font-mono uppercase text-gold"
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.66rem)", letterSpacing: "0.3em", marginBottom: "0.45rem" }}
            >
              Talent
            </p>
            <h2
              className="font-wordmark font-black uppercase leading-[0.86]"
              style={{ fontSize: "clamp(2rem, 6vw, 5.6rem)", letterSpacing: "-0.06em" }}
            >
              People in Focus
            </h2>
          </div>
          <span
            className="font-mono uppercase text-white/35"
            style={{ fontSize: "clamp(0.5rem, 0.82vw, 0.62rem)", letterSpacing: "0.18em" }}
          >
            Actors / Directors / Creators
          </span>
        </div>

        <ScrollRow
          showArrows={people.length > 5}
          scrollAmount={420}
          gap="clamp(0.8rem, 1.8vw, 1.35rem)"
          arrowSize="2.35rem"
          ariaLabel="People in focus"
        >
          {people.map((person) => {
            const credits = knownFor(person);

            return (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                aria-label={`Open ${person.name}`}
                className="group flex-shrink-0 outline-none"
                style={{ width: "clamp(132px, 15vw, 210px)", scrollSnapAlign: "start" }}
              >
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-card"
                  style={{ boxShadow: "0 22px 60px rgba(0,0,0,0.42)" }}
                >
                  <LazyImage
                    src={profileUrl(person.profile_path, "h632")}
                    alt=""
                    fallbackType="poster"
                    className="h-full w-full object-cover transition-transform duration-slow ease-cinematic group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent opacity-90" />
                  <span
                    className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 font-mono text-white backdrop-blur-md"
                    style={{ fontSize: "clamp(0.48rem, 0.8vw, 0.62rem)", letterSpacing: "0.16em" }}
                  >
                    FOCUS
                  </span>
                </div>

                <h3
                  className="mt-3 min-w-0 truncate font-wordmark font-black uppercase text-white transition-colors duration-fast group-hover:text-gold"
                  style={{ fontSize: "clamp(0.78rem, 1.2vw, 0.98rem)" }}
                >
                  {person.name}
                </h3>
                {credits && (
                  <p
                    className="mt-1 line-clamp-1 font-body text-white/45"
                    style={{ fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)" }}
                  >
                    {credits}
                  </p>
                )}
              </Link>
            );
          })}
        </ScrollRow>
      </div>
    </section>
  );
};

export default PeopleInFocusSection;
