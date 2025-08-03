"use client";
import {ReactNode} from "react";
import {clsx} from "clsx";
import {useIsRebrandEnabled} from "@/src/hooks/useIsRebrandEnabled";
import {getBrandText} from "@/src/utils/brandName";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";
import {Providers} from "@/src/core/providers/Providers";
import {
  FeatureGuard,
  Header,
  HeaderNew,
  ClientSplashWrapper,
} from "@/src/components/common";
import Footer from "@/src/components/common/Footer/Footer";
import GlitchEffects from "@/src/components/common/GlitchEffects/GlitchEffects";

interface LayoutBodyProps {
  children: ReactNode;
  inter: any;
  prompt: any;
  jetBrainsMono: any;
  ibmPlexMono: any;
  vt323: any;
  instrumentSerif: any;
}

export const LayoutBody = ({
  children,
  inter,
  prompt,
  jetBrainsMono,
  ibmPlexMono,
  vt323,
  instrumentSerif,
}: LayoutBodyProps) => {
  const glitchScavengerHuntEnabled = useAnimationStore.getState().masterEnabled;
  const rebrandEnabled = useIsRebrandEnabled();
  const brandText = getBrandText();

  const fontThemeVars = rebrandEnabled
    ? ({
        "--font-alt": "var(--font-cartograph-cf)",
        "--font-sans": "var(--font-inter-variable)",
        "--font-serif": "var(--font-instrument-serif)",
      } as React.CSSProperties)
    : ({
        "--font-alt": "var(--font-inter)",
        "--font-sans": "var(--font-inter)",
      } as React.CSSProperties);

  return (
    <body
      className={clsx(
        inter.className,
        inter.variable,
        prompt.variable,
        jetBrainsMono.variable,
        ibmPlexMono.variable,
        vt323.variable,
        instrumentSerif.variable
      )}
      style={fontThemeVars}
    >
      <Providers>
        <ClientSplashWrapper>
          <div className="flex flex-col min-h-screen relative">
            <FeatureGuard fallback={<Header />}>
              <HeaderNew />
            </FeatureGuard>
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            {glitchScavengerHuntEnabled && <GlitchEffects />}
          </div>
        </ClientSplashWrapper>
      </Providers>
    </body>
  );
};
