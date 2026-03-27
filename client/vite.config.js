import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendProxy = {
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
  },
  "/uploads": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: backendProxy,
  },
  preview: {
    proxy: backendProxy,
  },
});
