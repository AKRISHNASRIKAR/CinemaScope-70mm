import React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useBackNavigation } from "@/hooks/useBackNavigation";

/**
 * Reusable BackButton component with cinematic styling.
 * Fixed position at left edge, outside center-container for easy access.
 */
const BackButton = ({ fallbackRoute = "/", className = "" }) => {
  const { goBack } = useBackNavigation(fallbackRoute);

  return (
    <button
      onClick={goBack}
      className={`
        fixed z-40 flex items-center justify-center
        text-white/70 hover:text-white
        transition-all duration-200 ease-in-out cursor-pointer
        hover:-translate-x-1
        ${className}
      `}
      style={{
        top: "calc(var(--navbar-height, 4rem) + 16px)",
        left: "clamp(0.75rem, 2vw, 1.5rem)",
      }}
      aria-label="Go back"
    >
      <ChevronLeftIcon sx={{ fontSize: "clamp(32px, 4vw, 40px)" }} />
    </button>
  );
};

export default BackButton;
