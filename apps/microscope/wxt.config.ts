import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react'
  ],
  vite: () => ({
        plugins: [
            tailwindcss()
        ],
    }),
  manifest: {
    permissions: ['storage', 'tabs', 'sidePanel'],
  },
  dev:{
    server:{
    port: 3010,
    }
  },
    webExt:  {
      startUrls: [
        process.env.SUPABASE ? process.env.SUPABASE_STUDIO_URL : `https://chromewebstore.google.com/detail/dldjpboieedgcmpkchcjcbijingjcgok?utm_source=item-share-cb`,
        process.env.MICROGAME_LOCAL_URL,
        `${process.env.MICROGAME_LOCAL_URL}/admin`,
      ],
 chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    },
  publicDir: '../../apps/microgame/public',
});
