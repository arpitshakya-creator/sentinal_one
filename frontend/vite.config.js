import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the backend API through a dev proxy so the browser can
// keep calling relative `/api/*` paths. Override the target with VITE_API_TARGET.
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:4001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
