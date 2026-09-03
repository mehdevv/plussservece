import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function copyIndexTo404(): Plugin {
  return {
    name: "copy-index-to-404",
    closeBundle() {
      const index = resolve(__dirname, "dist/index.html");
      if (existsSync(index)) {
        copyFileSync(index, resolve(__dirname, "dist/404.html"));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyIndexTo404()],
});
