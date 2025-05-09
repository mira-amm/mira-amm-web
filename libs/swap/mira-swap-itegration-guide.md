# 🧩 Mira Swap Integration Guide

Configure the **Mira Swap** component in Swaylend Next.js application with proper domain access, CSP setup, image security, styling and client-side rendering support.

---

## 1. 📦 Install Required Packages

Run the following command in your frontend app:

```bash
pnpm add mira-dex-ts@1.1.42 react-tooltip
```

> ⚠️ Ensure `mira-dex-ts` is exactly version `1.1.42` to ensure compatibility with the current component.
> ⚠️ Also use the same peer dependencies as mira swap.

---

## 2. 🧱 Install Mira Swap Component

```bash
pnpm add "mira-swap published package"
```

---

## 3. 🔐 Configure Content Security Policy (CSP)

To ensure Mira Swap and its dependencies work securely, add these domains to your CSP:

### ✅ `connect-src`, `img-src`, `frame-src` Directives

Swaylend `CONNECT_DOMAINS` list should include the following domains from Mira:
You can import this from the `"published mira swap package"`

```ts
const DOMAINS = [
  "https://mainnet-explorer.fuel.network",
  "https://explorer-indexer-mainnet.fuel.network",
  "https://verified-assets.fuel.network",
  "https://mira-dex.squids.live/mira-indexer@v3/api/graphql",
  "https://firebasestorage.googleapis.com",
  "https://github.com",
  "https://img.icons8.com",
  "https://upload.wikimedia.org",
  "https://12factor.net",
  "https://firebasestorage.googleapis.com",
  "https://verified-assets.fuel.network",
  "https://4021016264-files.gitbook.io",
  "https://i.imgur.com"
];
```

Use it in your CSP header:

```ts
const CSP_HEADER = \`
  default-src 'self';
  connect-src 'self' https://app.swaylend.com ${CONNECT_DOMAINS.join(' ')};
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: ${CONNECT_DOMAINS.join(' ')};
  font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://layerswap.io https://mira.ly;
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
\`;
```

Inject into `next.config.js`:

```ts
headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: CSP_HEADER.replace(/\n/g, '') },
      ],
    },
  ];
}
```

---

## 4. 🖼️ Allow External Images in `next.config.js`

Mira Swap loads external images from various CDN and asset sources. Add this to your Next.js config:

```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**",
    },
  ],
},
```

---

## 5. ⚙️ Define Required Environment Variables

Ensure the following are set in `.env` or your deployment environment:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SENTIO_API_KEY=
NEXT_PUBLIC_SENTIO_API_URL=
NEXT_PUBLIC_FUEL_EXPLORER_URL=
NEXT_PUBLIC_FUEL_NODE_URL=
```

---

## 6. 💡 Mark Usage as Client Component

Every page or component that renders `Mira Swap component` **must** include:

```ts
'use client';
```

---

## 7. 🎨 Styling

1. In the page where the Mira Swap component is imported, import the component styles as well

```ts
import "published package/dist/libs/swap/assets/index.css"
```

2. Also, include this Mira styling in your `global.css` file

```css
@layer base {
  :root {
    --background-primary: #0E111E;
    --background-secondary: #1B1C23;
    --background-grey-darker: rgba(255, 255, 255, 0.05);
    --background-grey-dark: rgba(255, 255, 255, 0.1);
    --background-grey-light: rgba(255, 255, 255, 0.2);
    --content-primary: #FFFFFF;
    --content-secondary: rgba(255, 255, 255, 0.8);
    --content-tertiary: rgba(255, 255, 255, 0.72);
    --content-dimmed-light: rgba(255, 255, 255, 0.64);
    --content-dimmed-dark: rgba(255, 255, 255, 0.4);
    --content-grey: #9D9D9D;
    --content-grey-dark: #6D6D6D;
    --content-inverse: #28282F;
    --accent-primary: #AEED0D;
    --accent-secondary: rgba(174, 237, 13, 0.4);
    --accent-dimmed: rgba(174, 237, 13, 0.1);
    --accent-warning: #F55353;
    --accent-alert: #d4b226;
    --content-positive: #46CC44;
    --points-gradient: linear-gradient(170deg, #262f5f 35%, #c41cff 100%);
  }
}
```

---

✅ You’re all set! Mira Swap is now fully integrated and secure.

# 🧩 Mira Swap – Local Integration Guide

This guide explains how to locally integrate the **Mira Swap** component into the **Swaylend** project.

---

## 1. ✅ Set the Chain to Testnet

Open the file:

```bash
libs/shared/src/utils/constants.ts
```

Update the network chain ID:

```ts
export const ValidNetworkChainId = CHAIN_IDS.fuel.testnet;
```

---

## 2. 🔨 Build the Swap Package

In the root of your monorepo, run:

```bash
pnpm nx build swap
```

---

## 3. 📦 Copy the Build Output to Swaylend

Copy the generated `dist` folder into the Swaylend repository:

---

## 4. ⚙️ Set Up Swaylend

Ensure you’ve followed the existing setup guide for Swaylend so it's ready to consume local packages.

---

## 5. 📥 Import Swap Component and Styles

In the Swaylend project, import the component and its styles:

```ts
import { Swap } from "<absolute-path>/dist/libs/swap";
import "<absolute-path>/dist/libs/swap/assets/index.css";
```

> 💡 Replace `<absolute-path>` with the correct absolute path to the copied `dist` directory.

---

## ✅ You're Done!

Mira Swap is now integrated into your local Swaylend instance.