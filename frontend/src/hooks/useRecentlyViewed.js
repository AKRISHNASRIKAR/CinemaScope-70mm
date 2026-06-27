/**
 * useRecentlyViewed — persists the last N visited film IDs in localStorage.
 *
 * Usage:
 *   const { recentFilms, addFilm } = useRecentlyViewed();
 *
 * Call addFilm(film) on any FilmPage mount to record the visit.
 * recentFilms is an array of { id, title, poster_path } objects,
 * most-recent first, capped at MAX_ITEMS.
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "cs_recently_viewed";
const STORAGE_VERSION_KEY = "cs_recently_viewed_version";
const STORAGE_VERSION = "2";
const MAX_ITEMS   = 10;

function readStorage() {
  try {
    if (localStorage.getItem(STORAGE_VERSION_KEY) !== STORAGE_VERSION) {
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items.filter((film) => film?.id && film?.title) : [];
  } catch {
    return [];
  }
}

function writeStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function useRecentlyViewed() {
  const [recentFilms, setRecentFilms] = useState(readStorage);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setRecentFilms(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addFilm = useCallback((film) => {
    if (!film?.id) return;
    setRecentFilms((prev) => {
      // Remove existing entry for this film (dedup), prepend, cap at MAX_ITEMS
      const filtered = prev.filter((f) => f.id !== film.id);
      const next = [
        { id: film.id, title: film.title, poster_path: film.poster_path ?? null },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    writeStorage([]);
    setRecentFilms([]);
  }, []);

  return { recentFilms, addFilm, clearRecent };
}
