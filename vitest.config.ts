import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // jsdom treats the default blank document as an opaque origin, where
    // localStorage throws a SecurityError — ThemeProvider needs a real origin.
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
