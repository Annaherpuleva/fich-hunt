import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@assets": path.resolve(__dirname, "./client/src/assets"),
    },
  },
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      onwarn(warning, warn) {
        // Ignore eval warnings from lottie-web
        if (warning.code === "EVAL" && warning.id?.includes("lottie-web")) {
          return
        }
        warn(warning)
      },
    },
    sourcemap: false,
    copyPublicDir: true,
  },
  publicDir: "../public",
  server: {
    port: 5173,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
