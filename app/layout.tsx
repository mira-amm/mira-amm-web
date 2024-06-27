import type {Metadata} from "next";
import Script from "next/script";
import {ReactNode} from "react";
import {clsx} from "clsx";
import {Prompt} from "next/font/google";
import localFont from "next/font/local";

import "@/public/css/globals.css";

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
  metadataBase: new URL('https://fuelname.com'),
  title: "MIRA Protocol - Trade, Swap and manage liquidity on the Fuel blockchain with MIRA AMM ",
  description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
    title: "Fuel Name Service - FNS Domains",
    siteName: 'Fuel Name Service',
    url: 'https://fuelname.com/',
    description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
    images: 'https://fuelname.com/images/preview.png',
  },
  twitter: {
    title: "Fuel Name Service - FNS Domains",
    description: "Discover the fastest AMM on Fuel blockchain. Trade securely with low fees and slippage, swap and earn by providing liquidity. Join the future of decentralized finance with MIRA Protocol.",
    images: 'https://fuelname.com/images/preview.png',
  },
};

const RootLayout = ({children}: Props) => {
  return (
    <html lang="en">
    <body className={clsx(
      sfUIText.className,
      prompt.variable,
      sfCompactText.variable
    )}>
      {children}
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
