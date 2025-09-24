import {BrandMetadata, BrandType} from "./types";

export const BRAND_CONFIGS: Record<BrandType, BrandMetadata> = {
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
