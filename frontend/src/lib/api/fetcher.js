import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

function resolveUrl(url) {
  if (url.startsWith("http")) return url;
  if (!BASE_URL || !API_KEY) {
    throw new Error("Missing TMDB configuration. Set VITE_BASE_URL and VITE_API_KEY.");
  }

  const separator = url.includes("?") ? "&" : "?";
  const hasLanguage = /[?&]language=/.test(url);
  const languageParam = hasLanguage ? "" : "&language=en-US";

  return `${BASE_URL}${url}${separator}api_key=${API_KEY}${languageParam}`;
}

export const fetcher = async (url) => {
  if (!url) return null;
  const res = await axios.get(resolveUrl(url));
  return res.data;
};

/**
 * Parallel fetcher for multiple endpoints.
 * Can be used with SWR array keys: useSWR(['/u1', '/u2'], parallelFetcher)
 */
export const parallelFetcher = async (args) => {
  const urls = Array.isArray(args) ? args : [args];
  return Promise.all(urls.map(url => fetcher(url)));
};
