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
 */
const ShareCardButton = ({ film }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-body font-medium uppercase tracking-[0.15em] border border-gold/40 text-white/70 hover:bg-gold/10 hover:text-white hover:border-gold/70 transition-all duration-normal cursor-pointer bg-transparent rounded-card"
        style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.72rem)", padding: "0.7rem 1.6rem" }}
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
