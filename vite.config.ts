import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// package.json uses "type": "module", so ESM __dirname is unavailable.
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Vendor split via Rolldown's advancedChunks (Vite 8 runs on Rolldown).
         * Groups are matched in order, so "recharts" is captured before the
         * generic "vendor" group — that keeps the heavy charting library out
         * of the eagerly-loaded vendor code and only fetched on demand by the
         * lazy chart components.
         */
        codeSplitting: {
          groups: [
            { name: "recharts", test: /[\\/]node_modules[\\/]recharts[\\/]/ },
            { name: "victory-vendor", test: /[\\/]node_modules[\\/](victory-vendor|d3-[a-z-]+)[\\/]/ },
            { name: "vendor", test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});
