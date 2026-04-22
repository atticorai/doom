import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";
import libraryTailwindConfig from "./traffic-library-src/tailwind.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build the Megara Traffic Library UI as a single ES module that exports the
// top-level App component. React / ReactDOM / Framer Motion are provided by
// the host page via the <script type="importmap"> in index.html, so we
// externalize them to avoid shipping a second copy.
export default defineConfig({
  plugins: [react()],
  // Vite lib mode doesn't replace process.env.NODE_ENV by default — deps like
  // lucide-react / scheduler check it at runtime. Define it here so the bundle
  // runs cleanly in the browser (no ReferenceError: process is not defined).
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": JSON.stringify({}),
  },
  css: {
    postcss: {
      plugins: [
        // Use the library's theme verbatim, but override content paths to
        // absolute so PostCSS (run from the repo root) scans the correct files.
        tailwindcss({
          ...libraryTailwindConfig,
          content: [
            path.resolve(__dirname, "traffic-library-src/src/**/*.{js,ts,jsx,tsx,html}"),
            path.resolve(__dirname, "traffic-library-src/index.html"),
          ],
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
