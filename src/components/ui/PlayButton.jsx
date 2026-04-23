import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const PlayButton = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Play film"
    className="
      w-16 h-16 rounded-circle
      flex items-center justify-center
      border border-white/40 bg-black/30
      backdrop-blur-sm
      text-white hover:bg-black/50 hover:border-white/70
      hover:scale-105 active:scale-95
      transition-all duration-normal ease-cinematic
      cursor-pointer
    "
  >
    <PlayArrowIcon sx={{ fontSize: 28 }} />
  </button>
);

export default PlayButton;
