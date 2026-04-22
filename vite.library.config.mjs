import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build the Megara Traffic Library UI as a single ES module that exports the
// top-level App component. React / ReactDOM / Framer Motion are provided by
// the host page via the <script type="importmap"> in index.html, so we
// externalize them to avoid shipping a second copy.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: path.resolve(__dirname, "traffic-library-src/tailwind.config.js"),
        }),
        autoprefixer(),
      ],
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "traffic-library-src/src/entry.tsx"),
      name: "MegaraLibrary",
      formats: ["es"],
      fileName: () => "library-ui.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "framer-motion"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "framer-motion": "FramerMotion",
        },
        assetFileNames: "library-ui.css",
      },
    },
    outDir: "build-library",
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
