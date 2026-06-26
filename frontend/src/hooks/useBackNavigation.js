import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useBackNavigation(fallbackRoute = "/") {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    // Check if there is history. Length 2 or more means we came from somewhere.
    // In SPAs, window.history.length isn't always reliable for "previous page in our app"
    // but it's the standard way to check for session history.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackRoute);
    }
  }, [navigate, fallbackRoute]);

  return { goBack };
}
