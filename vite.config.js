import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base: "./"` keeps asset paths relative, so the build works served from a
// domain root or from a subfolder without reconfiguring anything.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // Pre-bundle the 3D libraries at dev-server start. Without this, Vite
  // discovers them the first time the lazy chunk is requested, re-optimises
  // mid-session and can fail that first dynamic import — which is exactly
  // the case that silently dropped the page to document mode.
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
  build: {
    // The room (three.js + fiber + drei + scenes) is a separate lazy chunk
    // that only loads after first paint; it is expected to be large.
    chunkSizeWarningLimit: 1400,
  },
});
