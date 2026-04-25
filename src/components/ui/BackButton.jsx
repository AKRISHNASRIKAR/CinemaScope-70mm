import React from "react";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { useBackNavigation } from "@/hooks/useBackNavigation";

/**
 * Reusable BackButton component with cinematic glass styling.
 * Smarter than window.history.back() — falls back to a default route
 * if no history exists (e.g. direct entry).
 */
const BackButton = ({ fallbackRoute = "/", label = "Back", className = "" }) => {
  const { goBack } = useBackNavigation(fallbackRoute);

  return (
    <button
      onClick={goBack}
      className={`
        group flex items-center gap-2 px-3 py-1.5 
        bg-black/20 backdrop-blur-md border border-white/10 
        rounded-full text-white/60 hover:text-white hover:bg-black/40 
        transition-all duration-200 ease-out cursor-pointer z-40
        ${className}
      `}
    >
      <KeyboardBackspaceIcon 
        sx={{ fontSize: 18 }} 
        className="transition-transform duration-200 group-hover:-translate-x-1" 
      />
      <span className="hidden sm:inline font-body text-sm font-medium tracking-wide">
        {label}
      </span>
    </button>
  );
};

export default BackButton;
