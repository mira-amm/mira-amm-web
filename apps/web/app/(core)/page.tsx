"use client";
import {useIsConnected} from "@fuels/react";
import {FeatureGuard} from "@/src/components/common";
import {Swap} from "@/src/components/common/Swap/Swap";
import {useFadeAnimation} from "@/src/hooks/useFadeAnimation";
import {BackgroundGlow} from "@/src/components/common/BackgroundGlow/BackgroundGlow";
import {AnimatedText} from "@/src/components/common/AnimatedText/AnimatedText";
import {AnimatePresence} from "framer-motion";

export default function Page() {
  const {isConnected} = useIsConnected();
  const {isVisible: isTitleVisible, shouldRender: shouldRenderTitle} =
    useFadeAnimation(!isConnected, 200);
  const {
    isVisible: isDescriptionVisible,
    shouldRender: shouldRenderDescription,
  } = useFadeAnimation(!isConnected, 200);
  const {isVisible: isSVGVisible, shouldRender: shouldRenderSVG} =
    useFadeAnimation(isConnected, 200);

  return (
    <div className="flex flex-1 flex-col items-center w-full lg:justify-center lg:min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-lg px-4 relative">
        <section className="space-y-10">
          <AnimatedText
            isVisible={isTitleVisible}
            shouldRender={shouldRenderTitle}
            className="text-5xl lg:text-6xl margin-auto text-center font-serif"
          >
            Trade like a predator.
          </AnimatedText>

          <div className="relative">
            <Swap />
            <FeatureGuard>
              <AnimatePresence mode="wait">
                {shouldRenderSVG && (
                  <BackgroundGlow
                    isVisible={isSVGVisible}
                    shouldRender={shouldRenderSVG}
                  />
                )}
              </AnimatePresence>
            </FeatureGuard>
          </div>

          <AnimatedText
            isVisible={isDescriptionVisible}
            shouldRender={shouldRenderDescription}
            className="text-content-tertiary text-md text-center"
          >
            The DLM-2000 is the biggest AMM on the Fuel Network. Earn rewards
            LPing and make lightning fast swaps.
          </AnimatedText>
        </section>
      </div>
    </div>
  );
}
