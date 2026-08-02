import { createHashRouter } from "react-router";
import { LaunchScreen } from "./launch/LaunchScreen";
import { WorkspaceScreen } from "./workspace/WorkspaceScreen";
import { GalleryPage } from "./gallery/GalleryPage";

/**
 * Hash routing, not browser history: the built app is loaded from Tauri's local
 * asset scheme, not served by an HTTP server that can rewrite nested paths.
 * See DECISIONS.md D-48.
 */
export const router = createHashRouter([
  { path: "/", element: <LaunchScreen /> },
  { path: "/project", element: <WorkspaceScreen /> },
  { path: "/gallery", element: <GalleryPage /> },
]);
