import { useRef, useState } from "react";
import IosShareIcon from "@mui/icons-material/IosShare";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CropIcon from "@mui/icons-material/Crop";
import { CARD_THEMES } from "../constants/cardThemes";
import { STAMPS } from "../constants/stamps";
import CardRating from "./CardRating";

/** Section label — mirrors the "Synopsis" label treatment on FilmPage. */
const Label = ({ children, hint }) => (
  <div className="flex items-baseline justify-between" style={{ marginBottom: "0.6rem" }}>
    <p className="font-mono text-gold uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.28em" }}>
      {children}
    </p>
    {hint && (
      <span className="font-mono text-faint" style={{ fontSize: "0.55rem", letterSpacing: "0.08em" }}>
        {hint}
      </span>
    )}
  </div>
);

const RatingControl = ({ value, tmdbValue, onChange }) => {
  const [hover, setHover] = useState(null);
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const display = hover ?? value ?? tmdbValue;

  const valueFromEvent = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    // Add a virtual 12px padding on edges so users don't have to hit the exact pixel edge for 0 or 5 stars
    const padding = 12;
    const usableWidth = rect.width - padding * 2;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left - padding) / usableWidth));
    return Math.round(x * 10) / 2;
  };

  const nudge = (delta) => {
    const base = value ?? tmdbValue ?? 0;
    onChange(Math.min(5, Math.max(0, base + delta)));
  };

  const handlePointerMove = (e) => {
    if (isDragging.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      onChange(valueFromEvent(e));
    } else {
      setHover(valueFromEvent(e));
    }
  };

  return (
    <div className="flex items-center flex-wrap" style={{ gap: "0.75rem" }}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Your rating"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value ?? 0}
        aria-valuetext={value != null ? `${value} of 5 stars` : "Using TMDB rating"}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-card"
        style={{ fontSize: "1.6rem", padding: "0.25rem", touchAction: "none" }}
        onPointerDown={(e) => {
          isDragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onChange(valueFromEvent(e));
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          isDragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
          onChange(valueFromEvent(e));
          setHover(null);
        }}
        onPointerCancel={() => {
          isDragging.current = false;
          setHover(null);
        }}
        onPointerLeave={() => {
          if (!isDragging.current) setHover(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); nudge(0.5); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); nudge(-0.5); }
          if (e.key === "Home") { e.preventDefault(); onChange(0); }
          if (e.key === "End") { e.preventDefault(); onChange(5); }
          if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onChange(null); }
        }}
      >
        <CardRating value={display ?? 0} color="#c9a843" trackColor="rgba(255,255,255,0.14)" size={0.85} gap={0.2} />
      </div>
      <span className="font-mono text-white/70" style={{ fontSize: "0.8rem" }}>
        {display ? display.toFixed(1) : "—"}
        <span className="text-faint"> / 5</span>
      </span>
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="font-mono uppercase text-muted hover:text-white transition-colors duration-fast cursor-pointer bg-transparent border border-white/10 hover:border-white/25 rounded-full"
          style={{ fontSize: "0.55rem", letterSpacing: "0.12em", padding: "0.3rem 0.7rem" }}
        >
          Use TMDB
        </button>
      )}
    </div>
  );
};

const ShareCardControls = ({
  themeId, onThemeChange,
  stampId, onStampChange,
  rating, tmdbRating, onRatingChange,
  caption, onCaptionChange,
  format, onFormatChange,
  posters, selectedPosterPath, onPosterChange, onAdjustClick,
  onShare, onDownload, onCopy,
  exporting, error, status,
}) => (
  <div className="flex flex-col" style={{ gap: "1.4rem" }}>
    {/* Theme */}
    <div>
      <Label>Theme</Label>
      <div className="flex flex-wrap" style={{ gap: "0.5rem" }} role="group" aria-label="Card theme">
        {CARD_THEMES.map((t) => {
          const active = t.id === themeId;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => onThemeChange(t.id)}
              className={`font-body uppercase tracking-[0.14em] rounded-card border transition-all duration-fast cursor-pointer ${
                active
                  ? "border-gold text-white bg-gold/10"
                  : "border-white/10 text-white/50 bg-transparent hover:border-white/30 hover:text-white/80"
              }`}
              style={{ fontSize: "0.62rem", padding: "0.55rem 1rem" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Stamp */}
    <div>
      <Label hint="optional">Stamp</Label>
      <div className="flex flex-wrap" style={{ gap: "0.5rem" }} role="group" aria-label="Approval stamp">
        <button
          type="button"
          aria-pressed={stampId == null}
          onClick={() => onStampChange(null)}
          className={`font-mono uppercase rounded-card border transition-all duration-fast cursor-pointer ${
            stampId == null
              ? "border-white/40 text-white bg-white/[0.06]"
              : "border-white/10 text-white/40 bg-transparent hover:border-white/30 hover:text-white/70"
          }`}
          style={{ fontSize: "0.58rem", letterSpacing: "0.12em", padding: "0.55rem 0.9rem" }}
        >
          None
        </button>
        {STAMPS.map((s) => {
          const active = s.id === stampId;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => onStampChange(active ? null : s.id)}
              className="font-mono uppercase rounded-card border transition-all duration-fast cursor-pointer bg-transparent"
              style={{
                fontSize: "0.58rem",
                letterSpacing: "0.12em",
                padding: "0.55rem 0.9rem",
                borderColor: active ? s.ink : "rgba(255,255,255,0.10)",
                color: active ? s.ink : "rgba(255,255,255,0.45)",
                background: active ? `${s.ink}14` : "transparent",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Rating */}
    <div>
      <Label hint="½-star steps">Rating</Label>
      <RatingControl value={rating} tmdbValue={tmdbRating} onChange={onRatingChange} />
    </div>

    {/* Caption */}
    <div>
      <Label hint={`${caption.length}/64`}>Caption</Label>
      <input
        type="text"
        value={caption}
        maxLength={64}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Absolute cinema."
        aria-label="Card caption"
        className="w-full font-body text-white/85 bg-white/[0.04] border border-white/10 rounded-card outline-none focus:border-gold/60 placeholder:text-faint transition-colors duration-fast"
        style={{ fontSize: "0.85rem", padding: "0.65rem 0.9rem" }}
      />
    </div>

    {/* Format */}
    <div>
      <Label>Format</Label>
      <div className="flex" style={{ gap: "0.5rem" }} role="group" aria-label="Export format">
        {[
          { id: "square", label: "Square · 1:1" },
          { id: "story", label: "Story · 9:16" },
        ].map((f) => {
          const active = f.id === format;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFormatChange(f.id)}
              className={`font-mono uppercase rounded-card border transition-all duration-fast cursor-pointer ${
                active
                  ? "border-gold text-white bg-gold/10"
                  : "border-white/10 text-white/50 bg-transparent hover:border-white/30 hover:text-white/80"
              }`}
              style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "0.55rem 1rem" }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Posters */}
    {posters && posters.length > 0 && (
      <div>
        <Label hint="optional">Poster</Label>
        <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: "0.5rem", paddingBottom: "0.5rem" }} role="group" aria-label="Card poster">
          {posters.map((p) => {
            const active = p.file_path === selectedPosterPath;
            return (
              <button
                key={p.file_path}
                type="button"
                aria-pressed={active}
                onClick={() => onPosterChange(p.file_path)}
                className={`relative shrink-0 rounded-card overflow-hidden transition-all duration-fast cursor-pointer ${
                  active ? "ring-2 ring-gold opacity-100" : "ring-1 ring-white/10 opacity-60 hover:opacity-100"
                }`}
                style={{ width: "3.5rem", aspectRatio: "2/3" }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w185${p.file_path}`}
                  alt="Poster option"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
        <div className="flex mt-2">
          <button
            type="button"
            onClick={onAdjustClick}
            className="flex items-center gap-2 font-mono uppercase text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-full bg-transparent transition-all duration-fast cursor-pointer"
            style={{ fontSize: "0.58rem", letterSpacing: "0.16em", padding: "0.35rem 0.9rem" }}
          >
            <CropIcon sx={{ fontSize: "0.8rem" }} />
            Adjust Framing
          </button>
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex flex-wrap items-center" style={{ gap: "0.75rem", marginTop: "0.25rem" }}>
      <button
        type="button"
        onClick={onShare}
        disabled={exporting}
        className="flex items-center gap-2 font-body font-semibold uppercase tracking-[0.14em] bg-gold text-ink hover:bg-gold-lt rounded-card transition-colors duration-fast cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        style={{ fontSize: "0.68rem", padding: "0.8rem 1.8rem" }}
      >
        <IosShareIcon sx={{ fontSize: "0.95rem" }} />
        {exporting ? "Preparing…" : "Share"}
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={exporting}
        className="flex items-center gap-2 font-body font-medium uppercase tracking-[0.14em] border border-white/20 text-white/70 hover:text-white hover:border-gold/60 bg-transparent rounded-card transition-all duration-fast cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        style={{ fontSize: "0.68rem", padding: "0.8rem 1.6rem" }}
      >
        <FileDownloadOutlinedIcon sx={{ fontSize: "1rem" }} />
        Download PNG
      </button>
      <button
        type="button"
        onClick={onCopy}
        disabled={exporting}
        className="flex items-center gap-2 font-body font-medium uppercase tracking-[0.14em] border border-white/20 text-white/70 hover:text-white hover:border-gold/60 bg-transparent rounded-card transition-all duration-fast cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        style={{ fontSize: "0.68rem", padding: "0.8rem 1.6rem" }}
      >
        <ContentCopyIcon sx={{ fontSize: "1rem" }} />
        Copy
      </button>
    </div>

    {/* Status / errors — polite live region */}
    <p
      aria-live="polite"
      className={`font-mono ${error ? "text-[#c96a5a]" : "text-muted"}`}
      style={{ fontSize: "0.62rem", letterSpacing: "0.08em", minHeight: "1em", margin: 0 }}
    >
      {error ||
        (status === "shared" && "Card shared.") ||
        (status === "downloaded" && "PNG saved to your downloads.") ||
        (status === "copied" && "Copied image and text to clipboard.") ||
        ""}
    </p>
  </div>
);

export default ShareCardControls;
