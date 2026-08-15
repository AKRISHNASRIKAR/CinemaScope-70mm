import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/* How long to keep re-applying a restored scroll position while a
   Suspense-ed page is still filling in its content. */
const RESTORE_WINDOW_MS = 1000;

/**
 * Window scroll management for the app's client-side navigations.
 *
 * <BrowserRouter> keeps whatever scroll offset the previous page had, so a new
 * page mounts mid-way down. React Router's own <ScrollRestoration> only ships
 * with data routers, so this hook covers the same ground:
 *
 *   PUSH    → new destination, start at the top
 *   REPLACE → same view syncing its URL (search/compare params), leave scroll alone
 *   POP     → back/forward, return to where the user was on that entry
 *
 * Positions live in a Map keyed by `location.key`, so they last for the session
 * and never leak between history entries that share a URL.
 */
export default function useScrollRestoration() {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();

  const positions = useRef(new Map());
  const activeKey = useRef(key);
  const isRestoring = useRef(false);

  /* Let us drive scrolling ourselves — the browser's native restoration fires
     before async page data has landed, which lands the user at a stale offset. */
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  /* Continuously record the offset of the entry currently on screen, so a later
     POP back to it has somewhere to return to. */
  useEffect(() => {
    const record = () => {
      if (isRestoring.current) return;
      positions.current.set(activeKey.current, window.scrollY);
    };
    window.addEventListener("scroll", record, { passive: true });
    return () => window.removeEventListener("scroll", record);
  }, []);

  useLayoutEffect(() => {
    // Scroll events from here on belong to the entry we're navigating to.
    activeKey.current = key;

    if (navigationType === "REPLACE") return;

    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }

    const target = navigationType === "POP" ? positions.current.get(key) ?? 0 : 0;

    if (target === 0) {
      window.scrollTo(0, 0);
      return;
    }

    /* The page may still be suspended and too short to hold the old offset —
       keep re-applying it until the content grows in, then give up. */
    isRestoring.current = true;
    const deadline = performance.now() + RESTORE_WINDOW_MS;
    let frame;

    const restore = () => {
      window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) > 1 && performance.now() < deadline) {
        frame = requestAnimationFrame(restore);
      } else {
        isRestoring.current = false;
      }
    };
    restore();

    return () => {
      cancelAnimationFrame(frame);
      isRestoring.current = false;
    };
  }, [key, hash, navigationType]);
}
