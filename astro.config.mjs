// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { SITE } from "./src/config/site.ts";

export default defineConfig({
  site: SITE.origin,
  base: SITE.base,
  output: "static",
  trailingSlash: "always",
  // Preserve HTML-aware whitespace; the Rust compiler's JSX default can remove
  // spaces between inline elements.
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  outDir: process.env.ASTRO_OUT_DIR || "./dist",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
