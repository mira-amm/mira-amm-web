import {Metadata} from "next";
import {getBrandText} from "@/src/utils/brandName";

const brandText = getBrandText();

export const metadata: Metadata = {
  title: `${brandText.name} DEX - The Liquidity Hub on Fuel`,
  description: `Trade tokens and provide liquidity on ${brandText.dex}, the most efficient AMM on Fuel Network.`,
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    siteName: `${brandText.name} DEX`,
    title: `${brandText.name} DEX - The Liquidity Hub on Fuel`,
    url: "https://microchain.systems",
    description: `Trade tokens and provide liquidity on ${brandText.dex}, the most efficient AMM on Fuel Network.`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title: `${brandText.name} DEX - The Liquidity Hub on Fuel`,
    description: `Trade tokens and provide liquidity on ${brandText.dex}, the most efficient AMM on Fuel Network.`,
    images: ["/og-twitter.png"],
  },
};
