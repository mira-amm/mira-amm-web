/// <reference types='vitest' />
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { reactRouterDevTools } from "react-router-devtools";
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/docs-react-router',
  server: {
    port: 4000,
    host: 'localhost',
  },
  preview: {
    port: 4000,
    host: 'localhost',
  },
  plugins: [
    reactRouterDevTools(),
    !process.env.VITEST && reactRouter(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: [
    // "beautify",
    // "react-diff-viewer-continued",
    // "classnames",
    // "@bkrem/react-transition-group",
    ],
    exclude: ['shiki','lucide-react']
  },
  // Uncomment this if you are using workers.
  worker:  {
    plugins: ()=> [ nxViteTsPaths() ],
  },
  build: {
    rollupOptions: {
      external: ['shiki', 'lucide-react'],
    },
    outDir: '../../dist/apps/docs-react-router',
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
      reportsDirectory: '../../coverage/apps/docs-react-router',
      provider: 'v8' as const,
    },
  },
}));
