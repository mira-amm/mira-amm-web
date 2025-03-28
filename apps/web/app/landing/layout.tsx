import type {Metadata} from "next";

import {ReactNode} from "react";

import "@/public/css/globals.css";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  metadataBase: new URL("https://mira.ly/"),
  title:
    "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
  description:
    "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
    title:
      "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
    siteName: "Mira Automated Market Maker",
    url: "https://mira.ly/",
    description:
      "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
    images: "https://mira.ly/images/preview.png",
  },
  twitter: {
    title:
      "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
    description:
      "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
    images: "https://mira.ly/images/preview.png",
  },
};
const LandingLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default LandingLayout;
