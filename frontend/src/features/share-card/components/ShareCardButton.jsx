import { Suspense, lazy, useState } from "react";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";

// The whole share-card experience (modal, html-to-image, and — one
// level deeper — three.js) stays out of the FilmPage chunk until the
// user actually opens it.
const ShareCardModal = lazy(() => import("./ShareCardModal"));

/** Minimal overlay spinner while the modal chunk streams in. */
const ModalLoading = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" aria-hidden>
    <div
      className="rounded-full border-2 border-gold border-t-transparent"
      style={{ width: "1.75rem", height: "1.75rem", animation: "spin 0.8s linear infinite" }}
    />
  </div>
);

/**
 * ShareCardButton — FilmPage entry point for the Collector Card.
 * Expects the full movie details object (with runtime + genres).
 * `className` / `style` replace the default pill look when the button
 * sits inside another surface (e.g. the film action card).
 */
const DEFAULT_CLASS =
  "inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-gold/40 bg-white/[0.04] font-body font-semibold uppercase whitespace-nowrap text-white/70 transition-all duration-normal cursor-pointer hover:border-gold/70 hover:bg-gold/10 hover:text-white focus-ring";
const DEFAULT_STYLE = { fontSize: "clamp(0.56rem, 0.82vw, 0.66rem)", letterSpacing: "0.16em", padding: "0.68rem 1.15rem" };

const ShareCardButton = ({ film, className = DEFAULT_CLASS, style = DEFAULT_STYLE }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={style}
        aria-haspopup="dialog"
      >
        <StyleOutlinedIcon sx={{ fontSize: "clamp(0.85rem, 1.3vw, 1rem)" }} />
        Share Card
      </button>

      {open && (
        <Suspense fallback={<ModalLoading />}>
          <ShareCardModal film={film} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default ShareCardButton;
