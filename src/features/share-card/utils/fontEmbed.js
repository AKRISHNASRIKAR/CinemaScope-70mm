/**
 * fontEmbed.js — self-contained @font-face CSS for card rasterization.
 *
 * html-to-image renders through an SVG <foreignObject>, which cannot
 * reach the document's web fonts — the typography has to travel with
 * the capture. The library's own font inliner walks document.styleSheets
 * and throws SecurityError on the cross-origin Google Fonts sheet, so
 * we build the CSS ourselves and hand it over via `fontEmbedCSS`.
 *
 * Only the faces the card actually uses, latin subset only:
 *   Playfair Display 700 + 400 italic — title, caption, back monogram
 *   DM Mono 400/500                   — metadata, serial
 *   Epilogue 800                      — wordmark, stamps
 */

const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=DM+Mono:wght@400;500" +
  "&family=Epilogue:wght@800" +
  "&family=Playfair+Display:ital,wght@0,700;1,400" +
  "&display=swap";

/** Keep only the `/* latin *\/` blocks — the app is latin-subset already. */
const LATIN_BLOCK = /\/\*\s*latin\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;

let cache = null; // Promise<string> — resolved once per session

async function fetchAsDataURL(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function build() {
  const res = await fetch(FONT_CSS_URL);
  if (!res.ok) throw new Error(`Font CSS ${res.status}`);
  const sheet = await res.text();

  let css = "";
  for (const [, block] of sheet.matchAll(LATIN_BLOCK)) css += `${block}\n`;
  if (!css) throw new Error("No latin font faces found");

  // Inline every woff2 the kept blocks reference (fonts.gstatic.com is CORS-open)
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]))];
  const dataUrls = await Promise.all(urls.map(fetchAsDataURL));
  urls.forEach((url, i) => {
    css = css.split(url).join(dataUrls[i]);
  });
  return css;
}

/**
 * Resolves to the embeddable CSS, or "" if anything fails — callers
 * pass "" straight through, which makes html-to-image skip its own
 * (SecurityError-throwing) font walk and fall back to system fonts
 * rather than failing the export outright.
 */
export function getFontEmbedCSS() {
  if (!cache) {
    cache = build().catch(() => "");
  }
  return cache;
}
