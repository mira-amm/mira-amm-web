import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react'
  ],
  manifest: {
 name: "Microscope",
    description: "Microchain Browser Extension",
      action: {
      default_title: "Microscope",
    },
 version: "0.0.0",
    permissions: [
      'storage',
      'tabs',
      "activeTab",
      "tabGroups",
      "fontSettings",
      "contextMenus",
      'sidePanel'
    ],
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
 // chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    },
  publicDir: '../../apps/microgame/public',
});
