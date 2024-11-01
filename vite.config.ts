import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import VitePluginRadar from "vite-plugin-radar"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePluginRadar({ analytics: [{ id: "G-5S1Q1RGDMM" }] })],
  server: {
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/setupTests",
    mockReset: true,
  },
})
