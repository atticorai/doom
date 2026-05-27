// Entry file used by the host Doom app. Re-exports App unchanged and pulls in
// the library's own index.css so Vite bundles its Tailwind layer + keyframes
// alongside the JS. No source files are modified — this wrapper exists only
// because the original index.tsx calls ReactDOM.render() directly.
import "./index.css";
export { App, ThemeContext } from "./App";

// Bundle version banner. If this line isn't in the console, the browser is still
// running a STALE cached library-ui.js and the per-group send (in app.js's
// MegaraLibraryActions) won't be reached. Bump the tag on every bundle change.
const MEGARA_BUNDLE_VERSION = "delegate-send-2026-05-27";
try {
  // eslint-disable-next-line no-console
  console.log(
    "%c📚 MegaraLibrary bundle: " + MEGARA_BUNDLE_VERSION,
    "background:#2d1f42;color:#4AC8E8;font-weight:700;padding:3px 8px;border-radius:4px"
  );
} catch (e) {}
(typeof window !== "undefined") && ((window as any).MEGARA_BUNDLE_VERSION = MEGARA_BUNDLE_VERSION);
