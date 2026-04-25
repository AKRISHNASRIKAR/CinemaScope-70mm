import React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useBackNavigation } from "@/hooks/useBackNavigation";

/**
 * Reusable BackButton component with cinematic styling.
 * Fixed position below navbar.
 */
const BackButton = ({ fallbackRoute = "/", className = "" }) => {
  const { goBack } = useBackNavigation(fallbackRoute);

  return (
    <div 
      className="fixed left-0 right-0 z-40 pointer-events-none" 
      style={{ top: "calc(var(--navbar-height, 4rem) + 16px)" }}
    >
      <div className="center-container px-4 sm:px-6 lg:px-12">
        <button
          onClick={goBack}
          className={`
            pointer-events-auto flex items-center justify-center
            text-white/70 hover:text-white
            transition-all duration-200 ease-in-out cursor-pointer
            hover:-translate-x-1 w-max -ml-2
            ${className}
          `}
          aria-label="Go back"
        >
          <ChevronLeftIcon sx={{ fontSize: "clamp(32px, 4vw, 40px)" }} />
        </button>
      </div>
    </div>
  );
};

export default BackButton;
