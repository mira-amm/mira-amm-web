/// <reference types='vitest' />
import {defineConfig} from "vitest/config";
import {nxViteTsPaths} from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/web",
  plugins: [nxViteTsPaths()],
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/web",
      provider: "v8" as const,
    },
  },
});
