/**
 * tmdbImage.js — Centralised TMDB image URL builder.
 *
 * TMDB CDN automatically serves WebP when the browser supports it
 * (based on Accept header), so we just pass through the original path.
 *
 * Usage:
 *   tmdbImage("w342", film.poster_path)        → poster URL
 *   tmdbImage("original", film.backdrop_path)  → backdrop URL
 *   tmdbImage("w200", person.profile_path)     → profile URL
 *   tmdbImage("h632", person.profile_path)     → tall profile URL
 *
 * Returns null if path is falsy (caller should handle fallback).
 */

const BASE = "https://image.tmdb.org/t/p";

export function tmdbImage(size, path) {
  if (!path) return null;
  // TMDB CDN auto-serves WebP when browser supports it
  return `${BASE}/${size}${path}`;
}

/** Convenience wrappers */
export const posterUrl   = (path, size = "w342")    => tmdbImage(size, path);
export const backdropUrl = (path, size = "original") => tmdbImage(size, path);
export const profileUrl  = (path, size = "w200")    => tmdbImage(size, path);
