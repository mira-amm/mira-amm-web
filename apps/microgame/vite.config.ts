/// <reference types='vitest' />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyPlugin from "@netlify/vite-plugin-react-router";
import { reactRouterDevTools } from "react-router-devtools";
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/microgame',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [
    process.env.NODE_ENV === 'development' && reactRouterDevTools(),
    !process.env.VITEST && reactRouter(),
    nxViteTsPaths({debug: true}),
    nxCopyAssetsPlugin(['*.md']),
    tailwindcss(),
    // tsconfigPaths(),
    // netlifyPlugin()
  ],
  // Uncomment this if you are using workers.
  worker:  {
    plugins: ()=> [ nxViteTsPaths() ],
  },
  build: {
    outDir: '../../dist/apps/microgame',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/microgame',
      provider: 'v8' as const,
    },
  },
}));
