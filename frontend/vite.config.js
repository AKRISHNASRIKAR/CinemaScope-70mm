import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TEMPORARY build-time diagnostic — remove once Cloudflare env var visibility is confirmed.
console.log("[env-check] VITE_SUPABASE_URL present:", Boolean(process.env.VITE_SUPABASE_URL));
console.log("[env-check] VITE_SUPABASE_ANON_KEY present:", Boolean(process.env.VITE_SUPABASE_ANON_KEY));
console.log("[env-check] VITE_BASE_URL present:", Boolean(process.env.VITE_BASE_URL));
console.log("[env-check] VITE_API_KEY present:", Boolean(process.env.VITE_API_KEY));

// https://vite.dev/config/
export default defineConfig({
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
  },
});
