import { useEffect } from "react";

const SITE_NAME = "CinemaScope";
const DEFAULT_TITLE = "CinemaScope — Cinematic Film Discovery";
const DEFAULT_DESCRIPTION =
  "Discover films, compare titles, explore cast profiles, and build a cinematic watchlist with CinemaScope.";
const DEFAULT_IMAGE = "/fallback-image-film.jpg";

function toAbsoluteUrl(value) {
  if (!value || typeof window === "undefined") return undefined;

  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return undefined;
  }
}

function upsertMeta(attribute, key, content) {
  if (typeof document === "undefined" || !content) return;

  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href) {
  if (typeof document === "undefined" || !href) return;

  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function upsertJsonLd(data) {
  if (typeof document === "undefined") return;

  const id = "cinemascope-jsonld";
  let script = document.getElementById(id);

  if (!data) {
    script?.remove();
    return;
  }

  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = "website",
  canonicalPath,
  noIndex = false,
  jsonLd,
}) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
    const canonicalUrl = toAbsoluteUrl(
      canonicalPath || `${window.location.pathname}${window.location.search}`
    );
    const imageUrl = toAbsoluteUrl(image || DEFAULT_IMAGE);
    const robots = noIndex ? "noindex, nofollow" : "index, follow";

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "application-name", SITE_NAME);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertCanonical(canonicalUrl);
    upsertJsonLd(jsonLd);
  }, [canonicalPath, description, image, jsonLd, noIndex, title, type]);

  return null;
};

export default SEO;
