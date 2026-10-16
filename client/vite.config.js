import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev:phone` serves over HTTPS on your network so phones can use camera, mic and location
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  if (mode === "https") {
    const { default: basicSsl } = await import("@vitejs/plugin-basic-ssl");
    plugins.push(basicSsl());
  }
  return { plugins, server: { port: 5173, proxy: { "/api": "http://localhost:5000" } } };
});
