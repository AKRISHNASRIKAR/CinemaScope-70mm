import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded without the VITE_ prefix filter: these stay in Node and are never
  // exposed to client code.
  const env = loadEnv(mode, __dirname, "");

  // Dev stand-in for the Pages Function (functions/api/tmdb/[[path]].js).
  //   TMDB_DEV_PROXY set   → forward to a deployed proxy speaking the same
  //                          <base>/<tmdb-path> protocol, e.g.
  //                          https://cscope.pages.dev/api/tmdb. No key needed
  //                          locally, and it works on networks that block
  //                          api.themoviedb.org.
  //   TMDB_DEV_PROXY unset → call TMDB directly with TMDB_API_KEY.
  const remoteProxy = env.TMDB_DEV_PROXY ? new URL(env.TMDB_DEV_PROXY.replace(/\/$/, "")) : null;
  const tmdbKey = env.TMDB_API_KEY || "";

  const rewriteTmdbPath = (requestPath) => {
    const url = new URL(requestPath, "http://localhost");
    const tmdbPath = url.pathname.replace(/^\/api\/tmdb/, "");
    url.searchParams.delete("api_key");
    if (remoteProxy) return `${remoteProxy.pathname}${tmdbPath}${url.search}`;

    url.searchParams.set("api_key", tmdbKey);
    if (!url.searchParams.has("language")) url.searchParams.set("language", "en-US");
    return `/3${tmdbPath}${url.search}`;
  };

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Relying on Vite's default chunking algorithm to avoid circular dependencies
      // and initialization ordering issues with React and Rollup.
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api/tmdb": {
          target: remoteProxy ? remoteProxy.origin : "https://api.themoviedb.org",
          changeOrigin: true,
          rewrite: rewriteTmdbPath,
        },
      },
    },
  };
});
