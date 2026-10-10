import { useState } from "react";
import { Link } from "react-router-dom";

import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import StarRating from "@/components/ui/StarRating";
import { ShareCardButton } from "@/features/share-card";
import { useFilmRating } from "@/hooks/useFilmRating";
import { useSession } from "@/hooks/useSession";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";

const LABEL_STYLE = { fontSize: "clamp(0.52rem, 0.74vw, 0.6rem)", letterSpacing: "0.2em" };
const ROW_PADDING = "clamp(0.9rem, 1.6vw, 1.15rem) clamp(0.9rem, 1.6vw, 1.15rem)";

const formatStars = (rating) => (rating / 2).toFixed(1);

/* Icon-over-label toggle — the two top-row actions of the card. */
const ActionToggle = ({ active, onClick, disabled, icon: Icon, activeIcon: ActiveIcon, label }) => {
  const Glyph = active ? ActiveIcon : Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center font-mono uppercase transition-colors duration-normal cursor-pointer focus-ring disabled:cursor-wait disabled:opacity-60 ${
        active ? "text-gold" : "text-white/50 hover:text-white"
      }`}
      style={{ ...LABEL_STYLE, gap: "0.5rem", padding: ROW_PADDING }}
    >
      <Glyph sx={{ fontSize: "clamp(1.5rem, 2.1vw, 1.8rem)" }} />
      {label}
    </button>
  );
};

/**
 * FilmActionCard — the film page's member panel: watched / watchlist toggles,
 * a half-star rating, and the share card. Signed-out visitors get a sign-in
 * row instead of the member actions; the share card needs no account
 * (nothing is uploaded), so it stays available either way.
 */
const FilmActionCard = ({ film }) => {
  const { isAuthenticated } = useSession();
  const { history, isLoading: historyLoading, logWatch, removeWatch } = useWatchHistory({
    enabled: isAuthenticated,
    limit: 12,
  });
  const {
    isLoading: watchlistLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = useWatchlist({ enabled: isAuthenticated });
  const { rating, average, count, isLoading: ratingLoading, rate, clearRating } = useFilmRating(film.id, {
    enabled: isAuthenticated,
  });
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const inWatchlist = isAuthenticated && isInWatchlist(film.id);
  const watched = isAuthenticated && history.some((item) => item.tmdb_id === film.id);
  const payload = {
    tmdb_id: film.id,
    title: film.title,
    poster_path: film.poster_path ?? null,
  };

  const run = async (action, task, fallbackMessage) => {
    setPendingAction(action);
    setStatus("");
    try {
      setStatus(await task());
    } catch (error) {
      setStatus(error.message || fallbackMessage);
    } finally {
      setPendingAction(null);
    }
  };

  const handleWatchlist = () =>
    run(
      "watchlist",
      async () => {
        if (inWatchlist) {
          await removeFromWatchlist(film.id);
          return "Removed from watchlist.";
        }
        await addToWatchlist(payload);
        return "Added to watchlist.";
      },
      "Could not update watchlist."
    );

  const handleWatched = () =>
    run(
      "watched",
      async () => {
        if (watched) {
          await removeWatch(film.id);
          return "Removed from watched.";
        }
        await logWatch(payload);
        return "Marked as watched.";
      },
      "Could not update watch history."
    );

  const handleRate = (next) =>
    run(
      "rating",
      async () => {
        await rate({ title: film.title, rating: next });
        // Rating a film implies having seen it.
        if (!watched) await logWatch(payload);
        return `Rated ${formatStars(next)} out of 5.`;
      },
      "Could not save your rating."
    );

  const handleClearRating = () =>
    run(
      "rating",
      async () => {
        await clearRating();
        return "Rating removed.";
      },
      "Could not remove your rating."
    );

  return (
    <aside
      aria-label={`Your activity for ${film.title}`}
      className="film-hero-actions overflow-hidden rounded-card border border-white/10 bg-white/[0.035] backdrop-blur-md"
      style={{ boxShadow: "0 34px 120px rgba(0,0,0,0.32)" }}
    >
      {isAuthenticated ? (
        <>
          <div className="flex divide-x divide-white/10">
            <ActionToggle
              active={watched}
              onClick={handleWatched}
              disabled={historyLoading || pendingAction === "watched"}
              icon={VisibilityOutlinedIcon}
              activeIcon={VisibilityIcon}
              label={watched ? "Watched" : "Watch"}
            />
            <ActionToggle
              active={inWatchlist}
              onClick={handleWatchlist}
              disabled={watchlistLoading || pendingAction === "watchlist"}
              icon={BookmarkAddOutlinedIcon}
              activeIcon={BookmarkAddedIcon}
              label="Watchlist"
            />
          </div>

          <div className="border-t border-white/10 text-center" style={{ padding: ROW_PADDING }}>
            <p className="font-mono uppercase text-white/42" style={{ ...LABEL_STYLE, marginBottom: "0.55rem" }}>
              {rating ? `Rated ${formatStars(rating)}` : "Rate"}
            </p>
            <StarRating
              value={rating}
              onChange={handleRate}
              disabled={ratingLoading || pendingAction === "rating"}
              label={`Rate ${film.title}`}
            />
            <div
              className="flex items-center justify-center font-body text-white/45"
              style={{ gap: "0.6rem", fontSize: "clamp(0.64rem, 0.9vw, 0.74rem)", marginTop: "0.5rem", minHeight: "1.2rem" }}
            >
              {count > 0 && average !== null && (
                <span>
                  Members <span className="font-mono text-white/75">{formatStars(average)}</span> / {count}{" "}
                  {count === 1 ? "rating" : "ratings"}
                </span>
              )}
              {rating && (
                <button
                  type="button"
                  onClick={handleClearRating}
                  disabled={pendingAction === "rating"}
                  className="font-body text-white/45 underline underline-offset-2 transition-colors duration-fast hover:text-white cursor-pointer focus-ring disabled:cursor-wait"
                  style={{ fontSize: "inherit" }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <Link
          to="/login"
          className="flex items-center justify-center font-mono uppercase text-gold transition-colors duration-normal hover:bg-gold/10 hover:text-gold-lt focus-ring"
          style={{ ...LABEL_STYLE, gap: "0.6rem", padding: ROW_PADDING }}
        >
          <LoginOutlinedIcon sx={{ fontSize: "1.1rem" }} />
          Sign in to log, rate or save
        </Link>
      )}

      <div className="border-t border-white/10">
        <ShareCardButton
          film={film}
          className="flex w-full items-center justify-center font-mono uppercase text-white/50 transition-colors duration-normal hover:bg-white/[0.04] hover:text-white cursor-pointer focus-ring"
          style={{ ...LABEL_STYLE, gap: "0.6rem", padding: ROW_PADDING }}
        />
      </div>

      {status && (
        <p
          className="border-t border-white/10 text-center font-body text-white/50"
          style={{ fontSize: "clamp(0.64rem, 0.9vw, 0.74rem)", padding: "0.6rem 0.9rem" }}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </aside>
  );
};

export default FilmActionCard;
