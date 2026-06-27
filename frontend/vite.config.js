import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@mui")) return "vendor-mui";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("react")) {
            return "vendor-react";
          }
          if (id.includes("axios") || id.includes("swr")) return "vendor-data";
          return "vendor";
        },
      },
    },
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
