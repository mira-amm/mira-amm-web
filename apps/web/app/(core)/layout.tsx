import {Analytics} from "@vercel/analytics/next";
import {ReactNode} from "react";
import {clsx} from "clsx";
import {
  Prompt,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Mono,
  VT323,
  Instrument_Serif,
} from "next/font/google";
import {metadata} from "./metadata";

import "../styles.css";
import "@/meshwave-ui/global.css";

import {LayoutBody} from "@/src/components/common/LayoutBody";

const prompt = Prompt({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-prompt",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
});

export const vt323 = VT323({
  weight: "400", // VT323 only has one weight
  subsets: ["latin"],
  variable: "--font-vt323", // optional: for CSS variables
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export {metadata};

export default function Layout({children}: {readonly children: ReactNode}) {
  // Get rebrand status for html attributes (server-side safe)
  const rebrandEnabled = process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";

  return (
    <html
      lang="en"
      className="dark"
      data-brand={rebrandEnabled ? "microchain" : "mira"}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="images/loader.webp" />
        <link rel="stylesheet" href="https://use.typekit.net/joy1wau.css" />
      </head>
      <LayoutBody
        inter={inter}
        prompt={prompt}
        jetBrainsMono={jetBrainsMono}
        ibmPlexMono={ibmPlexMono}
        vt323={vt323}
        instrumentSerif={instrumentSerif}
      >
        {children}
      </LayoutBody>
      <Analytics />
    </html>
  );
}
