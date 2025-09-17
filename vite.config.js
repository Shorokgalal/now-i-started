// vite.config.js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "/",                          // ✅ keep the trailing comma below
  server: { port: 5173, host: true }, // ✅ comma here matters
  build: {
    chunkSizeWarningLimit: 1000,      // optional, quiets the “>500kB” warning
  },
})
