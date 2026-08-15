import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EM_DIVISOR } from "../constants/cardLayout";
import ShareCard from "./ShareCard";

/* ── Zoom ──────────────────────────────────────────────────────────
   Offsets are in card `em` — CardPoster feeds them straight into
   object-position — so everything here is reasoned about in em, not px.

   ZOOM_MIN is 1, not the old 0.5: CardPoster draws the artwork at
   `scale(1.05 * scale)` over an object-fit:cover image, so anything
   below 1 shrinks it inside its own frame and exposes the background.
─────────────────────────────────────────────────────────────────── */
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.05;
const NUDGE = 0.25;           // em per arrow-key press
const PREVIEW_WIDTH = 260;

const DEFAULTS = { scale: 1, offset: { x: 0, y: 0 } };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ── Pan limits ────────────────────────────────────────────────────
   Pan has to stop where the artwork runs out, or you can drag the
   poster clean out of its own frame and expose the card background.

   The two axes have very different room, which is why one constant
   won't do. The poster window is the card's 20em width minus 0.8em
   padding a side ≈ 18.4em, and it's wider than it is tall — so a 2:3
   poster under object-fit:cover is fitted on width and overflows
   heavily on height.

   → Horizontal room comes *only* from CardPoster's 1.05 over-scale plus
     whatever zoom is applied.
   → Vertical room is large and stays roughly flat across the zoom range
     (the cover overflow shrinks in em as the scale divisor grows), so a
     single conservative constant covers it. The poster window's height
     also moves with the optional caption, which makes modelling it
     precisely not worth it.

   The `/ s` in the x limit is the part that's easy to get wrong:
   `transform: scale()` is applied *after* object-position, so a shift of
   X em renders as X * s em. Without dividing back out you permit exactly
   `s` times too much travel and the artwork slides out of its frame.
─────────────────────────────────────────────────────────────────── */
const POSTER_WIDTH_EM = 18.4;   // card 20em − 0.8em padding a side
const OVERSCALE = 1.05;         // must track CardPoster's scale(1.05 * scale)
const PAN_LIMIT_Y = 6;

const panLimits = (scale) => {
  const s = OVERSCALE * scale;
  return {
    x: Math.max(0, (POSTER_WIDTH_EM * (s - 1)) / (2 * s)),
    y: PAN_LIMIT_Y,
  };
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* ── Section label with a live value readout ───────────────────── */
const Label = ({ children, value }) => (
  <div className="flex items-baseline justify-between" style={{ marginBottom: "0.6rem" }}>
    <span className="font-mono text-gold uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.28em" }}>
      {children}
    </span>
    {value && (
      <span className="font-mono text-faint" style={{ fontSize: "0.58rem", letterSpacing: "0.08em" }}>
        {value}
      </span>
    )}
  </div>
);

/**
 * PosterAdjustModal — reframe the card's artwork.
 *
 * Direct manipulation first: drag the preview to pan, scroll to zoom.
 * The previous version exposed pan as two abstract sliders, which meant
 * framing an image by watching three numbers. Zoom keeps a slider,
 * because a single bounded scalar is genuinely what that control is.
 */
const PosterAdjustModal = ({
  isOpen,
  onClose,
  onSave,
  cardData,
  initialScale = DEFAULTS.scale,
  initialOffset = DEFAULTS.offset,
}) => {
  const reduced = useReducedMotion();
  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState(initialOffset);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef(null);
  const dragRef = useRef(null);

  /* Sync when the modal opens */
  useEffect(() => {
    if (isOpen) {
      setScale(initialScale);
      setOffset(initialOffset);
    }
  }, [isOpen, initialScale, initialOffset]);

  /* Escape, scroll lock, focus handoff */
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [isOpen, onClose]);

  /* Keep Tab inside the dialog — matches ShareCardModal's trap. */
  const trapTab = useCallback((e) => {
    if (e.key !== "Tab") return;
    const els = panelRef.current?.querySelectorAll(FOCUSABLE);
    if (!els?.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  /* ── Drag to pan ────────────────────────────────────────────────
     Pixels convert to card `em` via the preview's own width, so the same
     gesture pans identically at any preview size.

     The direction is inverted on purpose: a larger object-position X
     reveals more of the image's right side, which reads as the artwork
     sliding left. Subtracting makes the poster follow the cursor. */
  const emPerPx = EM_DIVISOR / PREVIEW_WIDTH;

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const lim = panLimits(scale);
    setOffset({
      x: clamp(d.ox - (e.clientX - d.px) * emPerPx, -lim.x, lim.x),
      y: clamp(d.oy - (e.clientY - d.py) * emPerPx, -lim.y, lim.y),
    });
  };

  const endDrag = () => { dragRef.current = null; setDragging(false); };

  /* Zooming out shrinks the horizontal room, so any existing offset has to
     be pulled back inside the new limits or the artwork pops out of frame. */
  const applyZoom = useCallback((next) => {
    const s = clamp(next, ZOOM_MIN, ZOOM_MAX);
    const lim = panLimits(s);
    setScale(s);
    setOffset((o) => ({ x: clamp(o.x, -lim.x, lim.x), y: clamp(o.y, -lim.y, lim.y) }));
  }, []);

  const onWheel = (e) => applyZoom(scale + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP));

  /* Arrow keys nudge — without this the control needs a pointer to use at all */
  const onPreviewKeyDown = (e) => {
    const moves = {
      ArrowLeft:  { x: -NUDGE, y: 0 },
      ArrowRight: { x:  NUDGE, y: 0 },
      ArrowUp:    { x: 0, y: -NUDGE },
      ArrowDown:  { x: 0, y:  NUDGE },
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const lim = panLimits(scale);
    setOffset((o) => ({
      x: clamp(o.x + m.x, -lim.x, lim.x),
      y: clamp(o.y + m.y, -lim.y, lim.y),
    }));
  };

  const reset = () => { setScale(DEFAULTS.scale); setOffset(DEFAULTS.offset); };
  const isDefault =
    scale === DEFAULTS.scale && offset.x === DEFAULTS.offset.x && offset.y === DEFAULTS.offset.y;

  if (!isOpen) return null;

  const ready = Boolean(cardData?.movie);
  const previewData = { ...cardData, posterScale: scale, posterOffset: offset };

  const entrance = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 14, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      style={{ padding: "clamp(0.75rem, 3vw, 2rem)" }}
    >
      <div
        className="absolute inset-0 bg-black/80"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="poster-adjust-title"
        onKeyDown={trapTab}
        {...entrance}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative flex flex-col w-full bg-surface border border-white/10 rounded-card outline-none overflow-hidden"
        style={{ maxWidth: "24rem", maxHeight: "calc(100dvh - 1.5rem)", boxShadow: "0 40px 120px rgba(0,0,0,0.85)" }}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between border-b border-white/[0.06] shrink-0"
          style={{ padding: "clamp(0.9rem, 2vw, 1.15rem) clamp(1rem, 3vw, 1.4rem)" }}
        >
          <h2
            id="poster-adjust-title"
            className="font-display font-bold text-white"
            style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)" }}
          >
            Adjust Poster
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close without saving"
            className="flex items-center justify-center text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-full bg-transparent transition-all duration-fast cursor-pointer"
            style={{ width: "2rem", height: "2rem", padding: 0 }}
          >
            <CloseIcon sx={{ fontSize: "1rem" }} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col overflow-y-auto scrollbar-hide"
          style={{ padding: "clamp(1rem, 3vw, 1.4rem)", gap: "clamp(1.1rem, 2.5vh, 1.5rem)" }}
        >
          {/* Draggable preview */}
          <div className="flex flex-col items-center" style={{ gap: "0.7rem" }}>
            {ready ? (
              <div
                role="application"
                tabIndex={0}
                aria-label="Poster framing. Drag to reposition, arrow keys to nudge, scroll to zoom."
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onWheel={onWheel}
                onKeyDown={onPreviewKeyDown}
                className="relative rounded-card outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                style={{
                  cursor: dragging ? "grabbing" : "grab",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                {/* pointerEvents:none so the gesture always lands on the wrapper */}
                <div style={{ pointerEvents: "none" }}>
                  <ShareCard data={previewData} width={PREVIEW_WIDTH} showStamp={false} />
                </div>
              </div>
            ) : (
              <div
                className="skeleton rounded-card"
                style={{ width: PREVIEW_WIDTH, aspectRatio: "5 / 7" }}
                aria-hidden
              />
            )}

            <p
              className="font-mono text-faint uppercase text-center"
              style={{ fontSize: "0.52rem", letterSpacing: "0.16em" }}
            >
              Drag to reposition · Scroll to zoom
            </p>
          </div>

          {/* Zoom */}
          <div>
            <Label value={`${scale.toFixed(2)}×`}>Zoom</Label>
            <input
              type="range"
              className="cs-range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={scale}
              onChange={(e) => applyZoom(parseFloat(e.target.value))}
              aria-label="Poster zoom"
            />
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            disabled={isDefault}
            className="self-center flex items-center gap-2 font-mono uppercase text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-full bg-transparent transition-all duration-fast cursor-pointer disabled:opacity-35 disabled:cursor-default disabled:hover:text-muted disabled:hover:border-white/10"
            style={{ fontSize: "0.55rem", letterSpacing: "0.16em", padding: "0.4rem 1rem" }}
          >
            <RestartAltIcon sx={{ fontSize: "0.85rem" }} />
            Reset framing
          </button>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end border-t border-white/[0.06] shrink-0"
          style={{ gap: "0.75rem", padding: "clamp(0.9rem, 2vw, 1.15rem) clamp(1rem, 3vw, 1.4rem)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="font-mono uppercase text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-card bg-transparent transition-all duration-fast cursor-pointer"
            style={{ fontSize: "0.6rem", letterSpacing: "0.14em", padding: "0.7rem 1.3rem" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onSave(scale, offset); onClose(); }}
            className="flex items-center gap-2 font-body font-semibold uppercase tracking-[0.14em] bg-gold text-ink hover:bg-gold-lt rounded-card transition-colors duration-fast cursor-pointer"
            style={{ fontSize: "0.68rem", padding: "0.7rem 1.6rem" }}
          >
            <CheckIcon sx={{ fontSize: "0.95rem" }} />
            Apply
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default PosterAdjustModal;
