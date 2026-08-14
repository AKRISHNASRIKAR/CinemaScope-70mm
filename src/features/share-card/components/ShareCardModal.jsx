import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import useSWR from "swr";
import CloseIcon from "@mui/icons-material/Close";
import FlipIcon from "@mui/icons-material/Flip";

import { fetcher } from "@/lib/api/fetcher";
import { posterUrl, backdropUrl } from "@/lib/utils/tmdbImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";

import { DEFAULT_THEME_ID, getTheme } from "../constants/cardThemes";
import { getStamp } from "../constants/stamps";
import { EM_DIVISOR } from "../constants/cardLayout";
import { toDataURL, cardFileName, downloadBlob, shareOrDownload, describeCard } from "../utils/shareCard";
import { useCardExport } from "../hooks/useCardExport";
import { useCardTilt } from "../hooks/useCardTilt";

import ShareCard from "./ShareCard";
import ShareCardBack from "./ShareCardBack";
import ShareCardControls from "./ShareCardControls";
import ExportStage from "./ExportStage";
import TextureSource from "./TextureSource";
import CardStamp from "./CardStamp";

// three + fiber + drei live in their own chunk — only fetched when the
// 3D preview actually renders (WebGL available, motion allowed).
const InteractiveCard3D = lazy(() => import("./three/InteractiveCard3D"));

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* Face textures are rasterized from a 540px-wide card at 2× — big enough
   to stay crisp when the 3D card fills the viewport, small enough to
   re-capture quickly while the user tweaks options. */
const TEXTURE_CARD_WIDTH = 540;
const TEXTURE_PIXEL_RATIO = 2;
const TEXTURE_EM_PX = TEXTURE_CARD_WIDTH / EM_DIVISOR;          // px per card em
const STAMP_EM_SCALE = TEXTURE_EM_PX * TEXTURE_PIXEL_RATIO;     // canvas px per em

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** If the three chunk or WebGL context dies, fall back to the HTML card. */
class Preview3DBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** HTML/CSS preview — non-WebGL and reduced-motion path (tilt + CSS flip). */
const HtmlCardPreview = ({ data, width, flipped, tiltDisabled, reduced }) => {
  const { tiltHandlers, tiltStyle } = useCardTilt({ maxTilt: 6, disabled: tiltDisabled });
  return (
    <div {...tiltHandlers} style={{ perspective: "1100px" }}>
      <div style={tiltStyle}>
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transition: reduced ? "none" : "transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <ShareCard data={data} width={width} animateStamp style={{ backfaceVisibility: "hidden" }} />
          <ShareCardBack
            data={data}
            width={width}
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ShareCardModal = ({ film, onClose }) => {
  const reduced = useReducedMotion();
  const coarse = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const webgl = useMemo(() => supportsWebGL(), []);
  const use3D = webgl && !reduced;

  /* ── Customization state ─────────────────────────────────────── */
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [stampId, setStampId] = useState(null);
  const [rating, setRating] = useState(null);
  const [caption, setCaption] = useState("");
  const [format, setFormat] = useState("square");
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState(null);

  /* ── Data ────────────────────────────────────────────────────── */
  const { data: credits } = useSWR(`/movie/${film.id}/credits`, fetcher);
  const director = credits?.crew?.find((c) => c.job === "Director")?.name ?? null;

  const { data: images } = useSWR(`/movie/${film.id}/images`, fetcher);
  const posters = images?.posters?.slice(0, 10) || [];
  const [selectedPosterPath, setSelectedPosterPath] = useState(film.poster_path);

  // Data-URL copies of TMDB art: deterministic captures, no re-fetch
  // per rasterization. TMDB CDN is CORS-open, so remote URLs also work
  // as a fallback while these load.
  const [posterData, setPosterData] = useState(null);
  const [backdropData, setBackdropData] = useState(null);
  useEffect(() => {
    let alive = true;
    toDataURL(posterUrl(selectedPosterPath, "w780")).then((d) => alive && d && setPosterData(d));
    // The backdrop is only ever shown blurred behind the card, so a small
    // source is indistinguishable — and it keeps the base64 payload (and
    // therefore the export rasterization) meaningfully faster.
    toDataURL(backdropUrl(film.backdrop_path, "w780")).then((d) => alive && d && setBackdropData(d));
    return () => { alive = false; };
  }, [selectedPosterPath, film.backdrop_path]);

  const posterSrc = posterData ?? posterUrl(selectedPosterPath, "w780");
  const backdropSrc = backdropData ?? backdropUrl(film.backdrop_path, "w780");

  const cardData = useMemo(
    () => ({
      movie: {
        id: film.id,
        title: film.title,
        year: film.release_date ? film.release_date.slice(0, 4) : null,
        runtime: film.runtime || null,
        genres: (film.genres || []).map((g) => g.name),
        tmdbRating: film.vote_average || null,
        posterSrc,
      },
      director,
      rating,
      stampId,
      caption: caption.trim(),
      themeId,
    }),
    [film, posterSrc, director, rating, stampId, caption, themeId]
  );

  const theme = getTheme(themeId);
  const stamp = getStamp(stampId);

  /* ── 3D texture pipeline ─────────────────────────────────────── */
  const [frontCanvas, setFrontCanvas] = useState(null);
  const [backCanvas, setBackCanvas] = useState(null);
  const [stampCanvas, setStampCanvas] = useState(null);
  const [textureFailed, setTextureFailed] = useState(false);
  useEffect(() => { if (!stampId) setStampCanvas(null); }, [stampId]);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const show3D = use3D && !textureFailed && frontCanvas && backCanvas;

  /* ── Export ──────────────────────────────────────────────────── */
  const { exportCard, exporting, error, stageRequest, handleStageReady, handleStageError } =
    useCardExport();

  const handleDownload = useCallback(async () => {
    setStatus(null);
    try {
      const blob = await exportCard(format);
      downloadBlob(blob, cardFileName(film.title, format));
      setStatus("downloaded");
    } catch { /* surfaced via hook error state */ }
  }, [exportCard, format, film.title]);

  const handleShare = useCallback(async () => {
    setStatus(null);
    try {
      const blob = await exportCard(format);
      const result = await shareOrDownload(blob, cardFileName(film.title, format), {
        title: film.title,
        text: `My CinemaScope card for ${film.title}`,
      });
      if (result !== "cancelled") setStatus(result);
    } catch { /* surfaced via hook error state */ }
  }, [exportCard, format, film.title]);

  /* ── Modal a11y: focus trap, Escape, scroll lock ─────────────── */
  const panelRef = useRef(null);
  useEffect(() => {
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
  }, [onClose]);

  const trapTab = useCallback((e) => {
    if (e.key !== "Tab") return;
    const els = panelRef.current?.querySelectorAll(FOCUSABLE);
    if (!els?.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  const previewWidth = useMemo(
    () => Math.min(300, (typeof window !== "undefined" ? window.innerWidth : 1024) - 112),
    []
  );

  const entrance = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 18, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ padding: "clamp(0.5rem, 2.5vw, 2rem)" }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        onKeyDown={trapTab}
        className="relative w-full bg-surface border border-white/10 rounded-card outline-none overflow-y-auto scrollbar-hide"
        style={{ maxWidth: "62rem", maxHeight: "calc(100dvh - 1.5rem)", boxShadow: "0 40px 120px rgba(0,0,0,0.85)" }}
        {...entrance}
        transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-white/[0.06]"
          style={{ padding: "clamp(1rem, 2vw, 1.4rem) clamp(1rem, 3vw, 1.75rem)" }}
        >
          <div className="flex items-baseline flex-wrap" style={{ gap: "0.75rem" }}>
            <h2 id="share-card-title" className="font-display font-bold text-white" style={{ fontSize: "clamp(1.05rem, 2vw, 1.35rem)" }}>
              Share Card
            </h2>
            <span className="font-mono text-muted uppercase line-clamp-1" style={{ fontSize: "0.62rem", letterSpacing: "0.16em" }}>
              {film.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share card dialog"
            className="flex items-center justify-center text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-full bg-transparent transition-all duration-fast cursor-pointer"
            style={{ width: "2.2rem", height: "2.2rem", padding: 0 }}
          >
            <CloseIcon sx={{ fontSize: "1.1rem" }} />
          </button>
        </div>

        {/* Body — card first on mobile, side-by-side on desktop */}
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          {/* Preview */}
          <section
            aria-label="Card preview"
            className="relative flex flex-col items-center justify-center bg-base overflow-hidden"
            style={{ padding: "clamp(1.25rem, 3vw, 2rem)", minHeight: "min(30rem, 72vh)" }}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              pointer.current = {
                x: ((e.clientX - r.left) / r.width - 0.5) * 2,
                y: ((e.clientY - r.top) / r.height - 0.5) * 2,
                active: true,
              };
            }}
            onPointerLeave={() => { pointer.current = { x: 0, y: 0, active: false }; }}
          >
            {/* Ambient glow behind the card */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(201,168,67,0.05), transparent 60%)" }}
            />

            {/* The WebGL canvas is aria-hidden, so the card's description
                has to be carried separately. The HTML preview labels
                itself via role="img", hence 3D-only. */}
            {show3D && (
              <p
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
              >
                {describeCard({ ...cardData, stamp })}
              </p>
            )}

            {show3D ? (
              <Preview3DBoundary
                fallback={
                  <HtmlCardPreview data={cardData} width={previewWidth} flipped={flipped} tiltDisabled={coarse || reduced} reduced={reduced} />
                }
              >
                <Suspense
                  fallback={
                    <HtmlCardPreview data={cardData} width={previewWidth} flipped={flipped} tiltDisabled={coarse || reduced} reduced={reduced} />
                  }
                >
                  <div style={{ width: "100%", height: "clamp(20rem, 56vh, 28rem)" }}>
                    <InteractiveCard3D
                      frontCanvas={frontCanvas}
                      backCanvas={backCanvas}
                      stampCanvas={stampCanvas}
                      stampRotate={stamp?.rotate ?? 0}
                      stampEmScale={STAMP_EM_SCALE}
                      theme={theme}
                      flipped={flipped}
                      pointer={pointer}
                      reduced={reduced}
                      coarse={coarse}
                      onToggleFlip={() => setFlipped((f) => !f)}
                    />
                  </div>
                </Suspense>
              </Preview3DBoundary>
            ) : (
              <HtmlCardPreview data={cardData} width={previewWidth} flipped={flipped} tiltDisabled={coarse || reduced} reduced={reduced} />
            )}

            {/* Flip + hint */}
            <div className="flex flex-col items-center" style={{ gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-pressed={flipped}
                className="flex items-center gap-2 font-mono uppercase text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-full bg-transparent transition-all duration-fast cursor-pointer"
                style={{ fontSize: "0.58rem", letterSpacing: "0.16em", padding: "0.45rem 1.1rem" }}
              >
                <FlipIcon sx={{ fontSize: "0.8rem" }} />
                {flipped ? "Show front" : "Flip card"}
              </button>
              {show3D && !coarse && (
                <span className="font-mono text-faint uppercase" style={{ fontSize: "0.52rem", letterSpacing: "0.14em" }}>
                  Move to tilt · Click to flip
                </span>
              )}
            </div>
          </section>

          {/* Controls */}
          <section
            aria-label="Card options"
            style={{ padding: "clamp(1.25rem, 3vw, 1.75rem)" }}
          >
            <ShareCardControls
              themeId={themeId}
              onThemeChange={setThemeId}
              stampId={stampId}
              onStampChange={setStampId}
              rating={rating}
              tmdbRating={film.vote_average ? Math.round(film.vote_average) / 2 : null}
              onRatingChange={setRating}
              caption={caption}
              onCaptionChange={setCaption}
              format={format}
              onFormatChange={setFormat}
              posters={posters}
              selectedPosterPath={selectedPosterPath}
              onPosterChange={setSelectedPosterPath}
              onShare={handleShare}
              onDownload={handleDownload}
              exporting={exporting}
              error={error}
              status={status}
            />
          </section>
        </div>
      </motion.div>

      {/* Off-screen rasterization: 3D face textures */}
      {use3D && (
        <>
          <TextureSource
            onCanvas={setFrontCanvas}
            onError={() => setTextureFailed(true)}
            pixelRatio={TEXTURE_PIXEL_RATIO}
            deps={[themeId, rating, cardData.caption, posterSrc, director, film.id]}
          >
            <ShareCard data={cardData} width={TEXTURE_CARD_WIDTH} showStamp={false} />
          </TextureSource>
          <TextureSource
            onCanvas={setBackCanvas}
            onError={() => setTextureFailed(true)}
            pixelRatio={TEXTURE_PIXEL_RATIO}
            deps={[themeId, rating, director, film.id]}
          >
            <ShareCardBack data={cardData} width={TEXTURE_CARD_WIDTH} />
          </TextureSource>
          {stamp && (
            <TextureSource
              onCanvas={setStampCanvas}
              pixelRatio={TEXTURE_PIXEL_RATIO}
              deps={[stampId]}
            >
              {/* Same em base as the 540px card, so the captured canvas
                  converts back to card `em` exactly (see CardMesh). */}
              <div style={{ fontSize: TEXTURE_EM_PX }}>
                <CardStamp stamp={stamp} flat />
              </div>
            </TextureSource>
          )}
        </>
      )}

      {/* Off-screen export stage — mounted only while exporting */}
      {stageRequest && (
        <ExportStage
          key={stageRequest.key}
          data={cardData}
          format={stageRequest.format}
          backdropSrc={backdropSrc}
          onReady={handleStageReady}
          onError={handleStageError}
        />
      )}
    </div>,
    document.body
  );
};

export default ShareCardModal;
