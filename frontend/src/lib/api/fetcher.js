import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

export const fetcher = async (url) => {
  if (!url) return null;
  const fullUrl = url.startsWith("http") 
    ? url 
    : `${BASE_URL}${url}${url.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=en-US`;
    
  const res = await axios.get(fullUrl);
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
