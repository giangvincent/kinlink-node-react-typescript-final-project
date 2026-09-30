import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    port: 5173,
    // The browser only ever talks to one origin. Vite forwards /api to
    // Express, which is why this project needs no CORS configuration at all.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
