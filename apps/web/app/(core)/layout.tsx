import {ReactNode} from "react";
import {clsx} from "clsx";
import {Prompt, Inter, JetBrains_Mono} from "next/font/google";

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

export {metadata};

export default function Layout({children}: {readonly children: ReactNode}) {
  const glitchScavengerHuntEnabled = useAnimationStore.getState().masterEnabled;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/images/loader.webp" />
      </head>
      <body
        className={clsx(
          inter.className,
          inter.variable,
          prompt.variable,
          jetBrainsMono.variable,
        )}
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
