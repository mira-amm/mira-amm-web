import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
'@wxt-dev/webextension-polyfill',
'@wxt-dev/auto-icons'
  ],
  autoIcons:{
  grayscaleOnDevelopment: false
  },
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
chromiumPref: {
extensions: {
pinned_extensions: ["hnphgidbodkcfeljaphpkpkpggbillab"],
},
devtools:{
preferences:{
"currentDockState": "\"left\"",
},
},
},
      startUrls: [
        process.env.SUPABASE ? process.env.SUPABASE_STUDIO_URL : `https://chromewebstore.google.com/detail/dldjpboieedgcmpkchcjcbijingjcgok?utm_source=item-share-cb`,
      ],
 // chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    },
  publicDir: '../../apps/microgame/public',
});
