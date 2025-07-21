import {ReactNode} from "react";
import {clsx} from "clsx";
import {
  Prompt,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Mono,
  VT323,
} from "next/font/google";
import {useIsRebrandEnabled} from "@/src/hooks/useIsRebrandEnabled";

import {metadata} from "./metadata";

import "../styles.css";
import "@/meshwave-ui/global.css";

import {Providers} from "@/src/core/providers/Providers";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";
import GlitchEffects from "@/src/components/common/GlitchEffects/GlitchEffects";
import {FeatureGuard, Header, HeaderNew} from "@/src/components/common";
import Footer from "@/src/components/common/Footer/Footer";

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
export {metadata};

export default function Layout({children}: {readonly children: ReactNode}) {
  const glitchScavengerHuntEnabled = useAnimationStore.getState().masterEnabled;
  const rebrandEnabled = useIsRebrandEnabled();

  const fontThemeVars = rebrandEnabled
    ? {
        "--font-alt": "var(--font-jetbrains-mono)",
      }
    : {
        "--font-alt": "var(--font-prompt)",
      };

  return (
    <html
      lang="en"
      className={rebrandEnabled ? "" : "dark"}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/images/loader.webp" />
      </head>
      <body
        className={clsx(
          inter.className,
          inter.variable,
          prompt.variable,
          jetBrainsMono.variable,
          ibmPlexMono.variable,
          vt323.variable
        )}
        style={fontThemeVars}
      >
        <Providers>
          <div className="flex flex-col min-h-screen relative">
            <FeatureGuard fallback={<Header />}>
              <HeaderNew />
            </FeatureGuard>
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            {glitchScavengerHuntEnabled && <GlitchEffects />}
          </div>
        </Providers>
      </body>
    </html>
  );
}
