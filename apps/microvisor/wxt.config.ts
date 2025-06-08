import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/webextension-polyfill',
    '@wxt-dev/auto-icons',
  ],
  autoIcons: {
    grayscaleOnDevelopment: false,
  },
  manifest: {
    name: 'Microvisor',
    description: 'Microchain Browser Extension',
    action: {
      default_title: 'Microvisor',
    },
    version: '0.0.0',
    permissions: [
      'storage',
      'tabs',
      'activeTab',
      'tabGroups',
      'fontSettings',
      'contextMenus',
      'sidePanel',
    ],
  },
  dev: {
    server: {
      port: 3010,
    },
  },
  webExt: {
    chromiumPref: {
      extensions: {
        pinned_extensions: ['hnphgidbodkcfeljaphpkpkpggbillab'],
      },
      devtools: {
        preferences: {
          currentDockState: '"left"',
        },
      },
    },
    startUrls: [
      process.env.SUPABASE
        ? process.env.SUPABASE_STUDIO_URL
        : 'https://github.com/mira-amm/mira-amm-web/pulls',
    ],
    // chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  },
  publicDir: '../../apps/admin/public',
});
