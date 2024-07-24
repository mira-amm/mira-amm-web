import type {Metadata} from "next";
import Script from "next/script";
import {ReactNode} from "react";
import {clsx} from "clsx";
import {Prompt} from "next/font/google";
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

const sfUIText = localFont({
  src: [
    {
      path: '../public/fonts/SF-UI-Text-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-UI-Text-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-UI-Text-Semibold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-sf-ui-text',
});

const sfCompactText = localFont({
  src: [
    {
      path: '../public/fonts/SF-Compact-Text-Heavy.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-sf-compact-text',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mira.ly/'),
  title: "Mira DEX - Trade, Swap and manage liquidity on the Fuel blockchain with MIRA AMM",
  description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Mira DEX - Trade, Swap and manage liquidity on the Fuel blockchain with MIRA AMM",
    siteName: 'Mira Automated Market Maker',
    url: 'https://mira.ly/',
    description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
    images: 'https://mira.ly/images/preview.png',
  },
  twitter: {
    title: "Mira DEX - Trade, Swap and manage liquidity on the Fuel blockchain with MIRA AMM",
    description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
    images: 'https://mira.ly/images/preview.png',
  },
};

const RootLayout = ({children}: Props) => {
  return (
    <html lang="en">
    <body className={clsx(
      sfUIText.className,
      sfUIText.variable,
      prompt.variable,
      sfCompactText.variable,
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
