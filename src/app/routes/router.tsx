import { createHashRouter } from "react-router";
import { LaunchScreen } from "./launch/LaunchScreen";
import { WorkspaceScreen } from "./workspace/WorkspaceScreen";
import { GalleryPage } from "./gallery/GalleryPage";
import { A3PreviewWindow } from "./a3PreviewWindow/A3PreviewWindow";
import { SettingsScreen } from "./settings/SettingsScreen";

/**
 * Hash routing, not browser history: the built app is loaded from Tauri's local
 * asset scheme, not served by an HTTP server that can rewrite nested paths.
 * See DECISIONS.md D-48.
 */
export const router = createHashRouter([
  { path: "/", element: <LaunchScreen /> },
  { path: "/project", element: <WorkspaceScreen /> },
  { path: "/gallery", element: <GalleryPage /> },
  /** Faz 8/Dilim 1 — §2.1: reached from `WorkspaceTopBar`'s gear icon, not `LaunchScreen`. */
  { path: "/settings", element: <SettingsScreen /> },
  /** 2026-08-04: the pop-out A3 preview's own window — see `a3PreviewWindow/window.ts`. */
  { path: "/a3-preview", element: <A3PreviewWindow /> },
]);
