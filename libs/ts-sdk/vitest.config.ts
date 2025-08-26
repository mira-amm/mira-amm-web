/// <reference types='vitest' />
import {defineConfig} from "vitest/config";
import {nxViteTsPaths} from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/ts-sdk",
  plugins: [nxViteTsPaths()],
  test: {
    watch: false,
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/mira-v1-ts",
      provider: "v8" as const,
    },
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
  },
  resolve: {
    alias: {
      // Add any path aliases if needed
    },
  },
});
