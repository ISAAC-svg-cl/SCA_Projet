import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].${Date.now()}.js`,
        chunkFileNames: `assets/[name].${Date.now()}.js`,
        assetFileNames: `assets/[name].${Date.now()}.[ext]`,
      },
    },
  },
});
