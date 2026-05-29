import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served at the domain root on Vercel.
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
