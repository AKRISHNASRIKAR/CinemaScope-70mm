import FilmCard from "@/components/ui/FilmCard";
import { monthYear } from "@/lib/utils/formatDate";

/**
 * FilmGrid — fluid poster grid shared by GenrePage, GenreRow and Home.
 *
 * Column count is derived from the available width via `auto-fill` + `minmax`,
 * so it reflows at every size without a single media query.
 *
 * Props:
 *   films      — TMDB movie objects
 *   minCard    — minimum card width (any CSS length, usually a clamp())
 *   gap        — grid gap
 *   subtitleFor— (film) => string, defaults to the release month + year
 */
const FilmGrid = ({
  films = [],
  minCard = "clamp(130px, 18vw, 200px)",
  gap = "clamp(0.75rem, 2vw, 1.5rem)",
  subtitleFor = (f) => monthYear(f.release_date),
}) => (
  <div
    className="grid"
    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCard}, 1fr))`, gap }}
  >
    {films.map((film) => (
      <FilmCard key={film.id} film={film} subtitle={subtitleFor(film)} />
    ))}
  </div>
);

export default FilmGrid;
