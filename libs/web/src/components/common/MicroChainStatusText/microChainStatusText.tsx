"use client";

import {motion, AnimatePresence} from "framer-motion";
import styles from "./MicroChainStatusText.module.css";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";
import IconButton from "../IconButton/IconButton";
import {useEffect, useState} from "react";
import ScrambleEffect from "../GlitchEffects/ScrambleEffect";
import GlitchAndScanLines from "../GlitchEffects/GlitchAndScanLines";
import {triggerClassAnimation} from "../GlitchEffects/ClassAnimationTrigger";

const SHOW_MENU = false;

const MicroChainStatusText = () => {
  const count = useAnimationStore((state) => state.animationCallCount);
  const hintText = useAnimationStore((state) => state.hintText);
  const isRadioPlaying = useAnimationStore((state) => state.isRadioPlaying);
  const isTriggeredManually = useAnimationStore(
    (state) => state.isTriggeredManually,
  );
  const [hasMounted, setHasMounted] = useState(false);
  const [glowClass, setGlowClass] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // While the page reloads and count is 3 show green texts
    if (!isTriggeredManually && count === 3) {
      setGlowClass(styles.greenFinal);
      return;
    }

    // Manual path with blinking
    if ((count === 1 || count === 2 || count === 3) && isTriggeredManually) {
      const totalDelay = count === 3 ? 2200 : 1900;

      const blinkTimeout = setTimeout(() => {
        setGlowClass(styles.briefGreenGlow);

        const finalTimeout = setTimeout(() => {
          if (count === 3) {
            setGlowClass(styles.greenFinal);
          } else {
            setGlowClass("");
          }
        }, 3000); // Duration of briefGreenGlow

        return () => clearTimeout(finalTimeout);
      }, totalDelay);

      return () => clearTimeout(blinkTimeout);
    }

    // Reset in other cases
    setGlowClass("");
  }, [count, isTriggeredManually]);

  const animateText = (text: string, shouldAnimate = true) => {
    return text.split("").map((char, index) => {
      if (!shouldAnimate) {
        return <span key={`plain-${text}-${char}-${index}`}>{char}</span>;
      }

      return (
        <motion.span
          key={`anim-${text}-${char}-${index}`}
          initial={{opacity: 0, scale: 2.5, y: -20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          transition={{
            delay: index * 0.3,
            duration: 1,
            ease: "easeOut",
          }}
          style={{display: "inline-block"}}
        >
          {char}
        </motion.span>
      );
    });
  };

  const length = count === 0 ? 10 : count === 1 ? 7 : count === 2 ? 4 : 0;

  if (!hasMounted) return;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          zIndex: "1000",
          display: SHOW_MENU ? "block" : "none",
        }}
      >
        <button onClick={() => useAnimationStore.getState().playRadioAudio()}>
          audio
        </button>
        <button onClick={() => ScrambleEffect()}>scramble</button>
        <button onClick={() => GlitchAndScanLines()}>glitch</button>
        <button onClick={() => triggerClassAnimation("rainbowColor")}>
          rainbow
        </button>
        <button onClick={() => triggerClassAnimation("dino")}>dino</button>
        <button
          onClick={() =>
            useAnimationStore.getState().handleMagicTripleClickToken()
          }
        >
          Token Trigger
        </button>
        <button
          onClick={() => useAnimationStore.getState().handleMagicInput("19.85")}
        >
          19.85 Trigger
        </button>
        <button
          onClick={() =>
            useAnimationStore.getState().handleMagicTripleClickCurrency()
          }
        >
          Currency Trigger
        </button>
        <button
          onClick={() => useAnimationStore.getState().resetAnimationCalls()}
        >
          reset
        </button>
      </div>
      <div className={`${styles.widget}`}>
        <div
          style={{display: "flex", gap: "3px", height: "24px"}}
          className={glowClass}
        >
          <span>[</span>

          {count >= 1 && animateText("MIC", count === 1 && isTriggeredManually)}
          {count >= 2 && animateText("ROC", count === 2 && isTriggeredManually)}
          {count >= 3 &&
            animateText("HAIN", count === 3 && isTriggeredManually)}

          {/* Remaining Underscores */}
          {Array.from({length}).map((_, index) => (
            <span key={`empty-${index}`} className={styles.emptyChar}>
              _
            </span>
          ))}
          <span>]</span>
          {isRadioPlaying && (
            <div>
              <IconButton
                onClick={() => useAnimationStore.getState().stopRadioAudio()}
                className={styles.muteButton}
              >
                <img
                  src="/images/Sound.gif"
                  alt="Speaker Playing"
                  width={24}
                  height={24}
                />
              </IconButton>
            </div>
          )}
        </div>
        <AnimatePresence>
          {hintText && (
            <motion.p
              className={styles.hintText}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 2}}
            >
              Hint: {hintText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MicroChainStatusText;
