import {BrandMetadata} from "./types";

export const BRAND_CONFIGS: Record<"mira" | "microchain", BrandMetadata> = {
  mira: {
    brandName: "MIRA",
    siteName: "MIRA DEX",
    baseUrl: "https://mira.ly",
    defaultTitle: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
    defaultDescription:
      "Discover seamless crypto swaps with MIRA DEX. Swap your digital assets instantly and securely on the Fuel blockchain. Enjoy best rates and minimal slippage with our optimized trading protocol",
    defaultImage: "https://mira.ly/images/preview.png",
    favicon: "/images/favicon.png",
  },
  microchain: {
    brandName: "Microchain",
    siteName: "Microchain DEX",
    baseUrl: "https://microchain.systems",
    defaultTitle:
      "Swap on Microchain DEX instantly with low slippage | Microchain Swaps",
    defaultDescription:
      "Discover seamless crypto swaps with Microchain DEX. Swap your digital assets instantly and securely on the Fuel blockchain. Enjoy best rates and minimal slippage with our optimized trading protocol",
    defaultImage: "https://microchain.systems/images/microchain-preview.png",
    favicon: "/images/microchain-favicon.png",
  },
} as const;
