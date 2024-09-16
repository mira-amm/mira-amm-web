import type {Metadata} from "next";
import Script from "next/script";
import {ReactNode} from "react";
import {clsx} from "clsx";
import {Prompt, Inter} from "next/font/google";
import localFont from "next/font/local";

import "@/public/css/globals.css";
import Providers from "@/src/core/providers/Providers";

type Props = Readonly<{
  children: ReactNode;
}>;

const prompt = Prompt({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-prompt'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mira.ly/'),
  title: "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
  description: "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
    siteName: 'Mira Automated Market Maker',
    url: 'https://mira.ly/',
    description: "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
    images: 'https://mira.ly/images/preview.png',
  },
  twitter: {
    title: "MIRA DEX: Swap, Trade, and Earn on Fuel Blockchain | MIRA Exchange & AMM",
    description: "Join MIRA DEX, the leading AMM on Fuel Blockchain. Experience rapid, low-fee trading and swaps. Dive into our decentralized platform to manage liquidity and maximize earnings. Trade securely, with minimal slippage. Your gateway to decentralized trading",
    images: 'https://mira.ly/images/preview.png',
  },
};

const RootLayout = ({children}: Props) => {
  return (
    <html lang="en">
    <head>
      <link rel="preload" as="image" href="/images/loader.webp" />
      <link rel="preload" as="image" href="/images/mimic.webp" />
    </head>
    <body className={clsx(
      inter.className,
      inter.variable,
      prompt.variable,
    )}>
    <Providers>
      {children}
    </Providers>
    </body>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-K113JNM8XN"/>
    <Script id="gtag">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-K113JNM8XN');
    `}</Script>
    </html>
  );
}

export default RootLayout;
