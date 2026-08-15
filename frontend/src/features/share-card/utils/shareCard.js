/**
 * shareCard.js — pure helpers for the share-card feature.
 * No React, no DOM assumptions beyond fetch/anchor download.
 */

/** Deterministic visual serial number derived from the TMDB id. */
export function cardNumber(movieId) {
  if (!movieId) return "0000";
  return String(movieId % 10000).padStart(4, "0");
}

/** "180 MIN" — or null when TMDB has no runtime. */
export function formatRuntime(minutes) {
  if (!minutes) return null;
  return `${minutes} MIN`;
}

/** TMDB 0–10 vote → nearest half-star on a 5-star scale. */
export function starsFromTmdb(voteAverage) {
  if (!voteAverage) return 0;
  return Math.round(voteAverage) / 2;
}

/**
 * Fetch a (CORS-enabled) image and return it as a data URL.
 *
 * TMDB's CDN sends `access-control-allow-origin: *`, so no proxy is
 * needed — but a plain <img> elsewhere on the page (the FilmPage hero,
 * say) may have already cached that URL as a *non-CORS* response, and
 * the HTTP cache will not hand that entry to a CORS request: the fetch
 * fails with a bare "Failed to fetch". Revalidating with `no-cache`
 * replaces the entry with a CORS-usable one, so the retry succeeds and
 * every later request for that URL does too.
 *
 * Returns null on genuine failure — callers fall back to the remote URL.
 */
export async function toDataURL(url) {
  if (!url) return null;

  const read = async (init) => {
    const res = await fetch(url, { mode: "cors", ...init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  try {
    return await read();
  } catch {
    try {
      return await read({ cache: "no-cache" });
    } catch {
      return null;
    }
  }
}

/**
 * Prose description of a card, for assistive tech.
 *
 * Used as the HTML card's `role="img"` label and — importantly — as a
 * visually hidden description alongside the WebGL preview, whose
 * <canvas> is aria-hidden and would otherwise expose nothing at all.
 */
export function describeCard({ movie, director, rating, stamp, caption }) {
  const stars = rating ?? starsFromTmdb(movie.tmdbRating);
  const facts = [director, movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(", ");
  return (
    `CinemaScope collector card number ${cardNumber(movie.id)} for ${movie.title}` +
    (facts ? `, ${facts}` : "") +
    `, rated ${stars || 0} out of 5 stars` +
    (stamp ? `, stamped ${stamp.label}` : "") +
    (caption ? `, captioned “${caption}”` : "")
  );
}

/** "cinemascope-oppenheimer-square.png" */
export function cardFileName(title, format) {
  const slug = (title || "film")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `cinemascope-${slug}-${format}.png`;
}

/** Trigger a local download of a Blob. Nothing leaves the browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat before revoking
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Share a PNG blob via the Web Share API when file-sharing is
 * supported; otherwise download it. Returns "shared" | "downloaded".
 * A user-cancelled share sheet resolves to "cancelled" (no fallback
 * download — the user changed their mind, don't fight them).
 */
export async function shareOrDownload(blob, filename, { title, text }) {
  const file = new File([blob], filename, { type: "image/png" });
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // Share failed for a real reason — fall through to download
    }
  }
  downloadBlob(blob, filename);
  return "downloaded";
}

/**
 * Copy a PNG blob and plain text directly to the clipboard.
 * Avoids desktop OS share sheet bugs that concatenate local file paths.
 */
export async function copyToClipboard(blob, { text }) {
  if (typeof navigator === "undefined" || !navigator.clipboard || !navigator.clipboard.write) {
    throw new Error("Clipboard API not supported");
  }
  const item = new ClipboardItem({
    "image/png": blob,
    "text/plain": new Blob([text], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
  return "copied";
}

/**
 * FUTURE COMPATIBILITY — serializable card descriptor.
 * A future backend can persist exactly this shape to power /card/:id.
 * V1 does not persist anything; this is the contract, not an API.
 */
export function serializeCardData({ movie, themeId, stampId, rating, caption }) {
  return {
    movieId: movie?.id ?? null,
    cardNo: cardNumber(movie?.id),
    themeId,
    stampId: stampId ?? null,
    rating: rating ?? null,
    caption: caption || null,
  };
}
