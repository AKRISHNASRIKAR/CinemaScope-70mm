import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const BrowseMoreLink = ({ genre, onClick, dark = true }) => (
  <button
    onClick={onClick}
    className={`
      group flex items-center gap-2 cursor-pointer
      font-body font-medium tracking-[0.18em] text-tag uppercase
      transition-colors duration-fast border-none bg-transparent
      ${dark ? "text-white/40 hover:text-white/80" : "text-ink-muted hover:text-ink"}
    `}
  >
    <span className="w-3 h-px bg-current inline-block transition-all duration-fast group-hover:w-5" />
    Browse More {genre}
    <ArrowForwardIcon sx={{ fontSize: 12 }} className="transition-transform duration-fast group-hover:translate-x-1" />
  </button>
);

export default BrowseMoreLink;
