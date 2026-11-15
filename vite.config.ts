import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre (~1.1 MB) changes rarely: separate chunk = stays cached across app deploys
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: "maplibre", test: /node_modules[\\/]maplibre-gl/ }],
        },
      },
    },
  },
});
