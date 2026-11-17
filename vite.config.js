import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        map: resolve(import.meta.dirname, "map/index.html"),
      },
    },
  },
});
