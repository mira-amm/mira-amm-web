/// <reference types='vitest' />
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import * as path from "path";
import {nxViteTsPaths} from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import {nxCopyAssetsPlugin} from "@nx/vite/plugins/nx-copy-assets.plugin";
import pkg from "./package.json";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/swap",
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["index.d.ts"]),
    dts({
      entryRoot: "src",
      include: ["src/domains.ts"],
      tsconfigPath: path.join(__dirname, "tsconfig.lib.json"),
    }),
  ],
  css: {
    modules: {
      generateScopedName: "[local]__[hash:base64:5]",
    },
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "../../dist/libs/swap",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    cssCodeSplit: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: {
        index: "src/index.ts",
        domains: "src/domains.ts",
      },
      name: "swap",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es"],
    },
    minify: false,
    rollupOptions: {
      external: [...Object.keys(pkg.peerDependencies), "react/jsx-runtime"],
      output: {
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
