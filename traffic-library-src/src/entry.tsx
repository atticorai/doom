// Entry file used by the host Doom app. Re-exports App unchanged and pulls in
// the library's own index.css so Vite bundles its Tailwind layer + keyframes
// alongside the JS. No source files are modified — this wrapper exists only
// because the original index.tsx calls ReactDOM.render() directly.
import "./index.css";
export { App, ThemeContext } from "./App";
