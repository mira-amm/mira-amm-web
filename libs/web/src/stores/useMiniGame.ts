import {create} from "zustand";
import {subscribeWithSelector} from "zustand/middleware";
import {playAudioEffect, stopCurrentAudio} from "../utils/playAudioEffect";
import ScrambleEffect from "../components/common/GlitchEffects/ScrambleEffect";
import GlitchAndScanLines from "../components/common/GlitchEffects/GlitchAndScanLines";
import {triggerClassAnimation} from "../components/common/GlitchEffects/ClassAnimationTrigger";

const HINT_1 = "Rwrarrw, careful how fast you switch those assets!";
const HINT_2 = "Slippage is so low these days, it feels great to live in 1985.";
const HINT_3 =
  "Easy there, Gordon Gecko. If you keep switching these prices, the market will tank.";

type AnimationTrigger = () => void;
type AnimationType =
  | "timer"
  | "tripleClickToken"
  | "magicNumber"
  | "tripleClickCurrency"
  | "globalAnimation";

interface AnimationState {
  masterEnabled: boolean;
  toggles: Record<AnimationType, boolean>;
  subscribers: AnimationTrigger[];
  inputBuffer: string;
  lastClicks: number[];
  intervalId: NodeJS.Timeout | null;
  isGlobalActive: boolean;
  calledAnimations: {
    tripleClickTokenSwap: boolean;
    magicInput: boolean;
    tripleClickCurrencySwap: boolean;
  };
  animationCallCount: number;
  isTriggeredManually: boolean;
  hintText: string;
  delayedTestTimeout: NodeJS.Timeout | null;
  delayedTestStartTime: number | null;
  delayedTestRemaining: number | null;
  isRadioPlaying: boolean;

  subscribe: (callback: AnimationTrigger) => () => void;
  triggerAnimations: () => void;
  getAnimationCallCount: () => number;
  handleMagicTripleClickToken: () => void;
  handleMagicInput: (value: string) => void;
  handleMagicTripleClickCurrency: () => void;
  resetAnimationCalls: () => void;

  startPeriodicGlobalAnimation: () => void;
  stopPeriodicGlobalAnimation: () => void;
  handleVisibilityChange: () => void;
  initializeGlobalAnimation: () => () => void;
  playRadioAudio: () => void;
  stopRadioAudio: () => void;
  initializeHintListener: (count?: number) => () => void;
}

// Local storage keys
const ANIMATION_CALLS_KEY = "animation-calls";
const ANIMATION_COUNT_KEY = "animation-count";

export const useAnimationStore = create<AnimationState>()(
  subscribeWithSelector((set, get) => ({
    masterEnabled: process.env.NEXT_PUBLIC_MINIGAME_MASTER === "true",
    toggles: {
      timer: true,
      tripleClickToken: true,
      magicNumber: true,
      tripleClickCurrency: true,
      globalAnimation: true,
    },
    subscribers: [],
    inputBuffer: "",
    lastClicks: [],
    intervalId: null,
    isGlobalActive: false,
    calledAnimations:
      typeof window !== "undefined"
        ? JSON.parse(
            localStorage.getItem(ANIMATION_CALLS_KEY) ||
              '{"tripleClickTokenSwap":false,"magicInput":false,"tripleClickCurrencySwap":false}',
          )
        : {
            tripleClickTokenSwap: false,
            magicInput: false,
            tripleClickCurrencySwap: false,
          },
    animationCallCount:
      typeof window !== "undefined"
        ? parseInt(localStorage.getItem(ANIMATION_COUNT_KEY) || "0")
        : 0,

    isTriggeredManually: false,
    hintText: "",
    delayedTestTimeout: null,
    delayedTestStartTime: null,
    delayedTestRemaining: null,

    subscribe: (callback) => {
      set((state) => ({subscribers: [...state.subscribers, callback]}));
      return () =>
        set((state) => ({
          subscribers: state.subscribers.filter((cb) => cb !== callback),
        }));
    },

    isRadioPlaying: false,

    playRadioAudio: () => {
      playAudioEffect("/audio/radio-audio.mp3", {
        volume: 0.7,
        maxDuration: 8000,
        onStart: () => set({isRadioPlaying: true}),
        onEnd: () => {
          set({isRadioPlaying: false});
        },
      });
    },

    stopRadioAudio: () => {
      stopCurrentAudio();
      set({isRadioPlaying: false});
    },

    triggerAnimations: () => {
      if (!get().masterEnabled) return;
      get().subscribers.forEach((cb) => cb());
    },

    getAnimationCallCount: () => {
      return get().animationCallCount;
    },

    handleMagicTripleClickToken: () => {
      const {
        masterEnabled,
        toggles,
        lastClicks,
        calledAnimations,
        animationCallCount,
        initializeHintListener,
      } = get();
      if (
        !masterEnabled ||
        !toggles.tripleClickToken ||
        calledAnimations.tripleClickTokenSwap ||
        animationCallCount !== 0
      )
        return;

      const now = Date.now();
      const recentClicks = lastClicks.filter((t) => now - t < 1000);

      if (recentClicks.length >= 2) {
        set({lastClicks: []});

        const animationSubscriber = () => {
          ScrambleEffect();
          get().subscribers = get().subscribers.filter(
            (sub) => sub !== animationSubscriber,
          );
        };

        // Update call tracking
        const newCalledAnimations = {
          ...calledAnimations,
          tripleClickTokenSwap: true,
        };
        const newCount = animationCallCount + 1;

        get().subscribers.push(animationSubscriber);
        get().triggerAnimations();

        setTimeout(() => {
          set({
            calledAnimations: newCalledAnimations,
            animationCallCount: newCount,
            isTriggeredManually: true,
          });
          initializeHintListener(newCount);

          if (typeof window !== "undefined") {
            localStorage.setItem(
              ANIMATION_CALLS_KEY,
              JSON.stringify(newCalledAnimations),
            );
            localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
          }
        }, 3500);
      } else {
        set({lastClicks: [...recentClicks, now]});
      }
    },

    handleMagicInput: (value: string) => {
      const {
        masterEnabled,
        toggles,
        inputBuffer,
        calledAnimations,
        animationCallCount,
        initializeHintListener,
        playRadioAudio,
      } = get();
      if (
        !masterEnabled ||
        !toggles.magicNumber ||
        calledAnimations.magicInput ||
        animationCallCount !== 1
      )
        return;

      const newBuffer = (inputBuffer + value).slice(-5).replace(/[^0-9.]/g, "");
      set({inputBuffer: newBuffer});

      if (newBuffer === "19.85") {
        const magicNumberSubscriber = () => {
          GlitchAndScanLines();
          playRadioAudio();
          set((state) => ({
            subscribers: state.subscribers.filter(
              (sub) => sub !== magicNumberSubscriber,
            ),
          }));
        };

        // set calledAnimations now, but NOT animationCallCount
        const newCalledAnimations = {...calledAnimations, magicInput: true};

        set({inputBuffer: ""});

        set((state) => ({
          subscribers: [...state.subscribers, magicNumberSubscriber],
        }));

        get().triggerAnimations();

        const newCount = animationCallCount + 1;

        const waitForRadioToStop = () => {
          const checkInterval = 500; // check every 500ms

          const intervalId = setInterval(() => {
            if (!get().isRadioPlaying) {
              clearInterval(intervalId);

              set({
                calledAnimations: newCalledAnimations,
                animationCallCount: newCount,
                isTriggeredManually: true,
              });

              initializeHintListener(newCount);

              if (typeof window !== "undefined") {
                localStorage.setItem(
                  ANIMATION_CALLS_KEY,
                  JSON.stringify(newCalledAnimations),
                );
                localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
              }
            }
          }, checkInterval);
        };

        // start after 4.5s delay (same as before)
        setTimeout(() => {
          waitForRadioToStop();
        }, 4500);
      }
    },

    handleMagicTripleClickCurrency: () => {
      const {
        masterEnabled,
        toggles,
        lastClicks,
        calledAnimations,
        animationCallCount,
        initializeHintListener,
      } = get();
      if (
        !masterEnabled ||
        !toggles.tripleClickCurrency ||
        calledAnimations.tripleClickCurrencySwap ||
        animationCallCount !== 2
      )
        return;

      const now = Date.now();
      const recentClicks = lastClicks.filter((t) => now - t < 1000);

      if (recentClicks.length >= 2) {
        set({lastClicks: []});

        const animationSubscriber = () => {
          triggerClassAnimation("rainbowColor");
          get().subscribers = get().subscribers.filter(
            (sub) => sub !== animationSubscriber,
          );
        };

        // Update call tracking
        const newCalledAnimations = {
          ...calledAnimations,
          tripleClickCurrencySwap: true,
        };
        const newCount = animationCallCount + 1;

        get().subscribers.push(animationSubscriber);
        get().triggerAnimations();

        setTimeout(() => {
          set({
            calledAnimations: newCalledAnimations,
            animationCallCount: newCount,
            isTriggeredManually: true,
          });
          initializeHintListener(newCount);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              ANIMATION_CALLS_KEY,
              JSON.stringify(newCalledAnimations),
            );
            localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
          }
        }, 4500);
      } else {
        set({lastClicks: [...recentClicks, now]});
      }
    },

    resetAnimationCalls: () => {
      const defaultCalled = {
        tripleClickTokenSwap: false,
        magicInput: false,
        tripleClickCurrencySwap: false,
      };
      set({
        calledAnimations: defaultCalled,
        animationCallCount: 0,
        hintText: "",
        isTriggeredManually: false,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(
          ANIMATION_CALLS_KEY,
          JSON.stringify(defaultCalled),
        );
        localStorage.setItem(ANIMATION_COUNT_KEY, "0");
      }
    },

    startPeriodicGlobalAnimation: () => {
      const {masterEnabled, toggles} = get();
      if (!masterEnabled || !toggles.globalAnimation) return;

      let isGlitchNext = true;

      const intervalId = setInterval(() => {
        const currentCount = get().animationCallCount;

        // Stop the animation after 3 total animation calls
        if (currentCount === 3) {
          get().stopPeriodicGlobalAnimation();
          return;
        }

        if (isGlitchNext) {
          GlitchAndScanLines();
        } else {
          triggerClassAnimation("dino");
        }
        isGlitchNext = !isGlitchNext;
      }, 30000); // 30 second interval

      set({intervalId, isGlobalActive: true});
    },

    stopPeriodicGlobalAnimation: () => {
      const {intervalId} = get();
      if (intervalId) {
        clearInterval(intervalId);
        set({intervalId: null, isGlobalActive: false});
      }
    },

    handleVisibilityChange: () => {
      if (document.visibilityState === "visible") {
        get().startPeriodicGlobalAnimation();
      } else {
        get().stopPeriodicGlobalAnimation();
      }
    },

    initializeGlobalAnimation: () => {
      if (typeof window === "undefined") return () => {};

      const store = get();
      const hintListenerCleanup = store.initializeHintListener(
        store.animationCallCount,
      );
      store.startPeriodicGlobalAnimation();

      const visibilityHandler = () => store.handleVisibilityChange();
      document.addEventListener("visibilitychange", visibilityHandler);

      return () => {
        hintListenerCleanup();
        store.stopPeriodicGlobalAnimation();
        document.removeEventListener("visibilitychange", visibilityHandler);
      };
    },

    initializeHintListener: (count?: number) => {
      const store = get();

      set({hintText: ""});

      if (store.delayedTestTimeout) {
        clearTimeout(store.delayedTestTimeout);
      }

      const updateHintText = () => {
        console.log("5 minutes have passed!");
        if (count === 0) set({hintText: HINT_1});
        if (count === 1) set({hintText: HINT_2});
        if (count === 2) set({hintText: HINT_3});
        if (count === 3) set({hintText: ""});
      };

      const startTimer = () => {
        // const delay = 5 * 60 * 1000; // 5 minutes
        const delay = count === 0 ? 15 * 1000 : 8 * 1000; // 10 seconds
        set({
          delayedTestStartTime: Date.now(),
          delayedTestRemaining: delay,
        });

        const timeoutId = setTimeout(() => {
          updateHintText();
          set({
            delayedTestTimeout: null,
            delayedTestStartTime: null,
            delayedTestRemaining: null,
          });
        }, delay);

        set({delayedTestTimeout: timeoutId});
      };
      const pauseTimer = () => {
        const {delayedTestTimeout, delayedTestStartTime} = get();
        if (delayedTestTimeout && delayedTestStartTime) {
          clearTimeout(delayedTestTimeout);
          const elapsed = Date.now() - delayedTestStartTime;
          set({
            delayedTestTimeout: null,
            delayedTestRemaining: 5 * 60 * 1000 - elapsed,
          });
        }
      };

      const resumeTimer = () => {
        const {delayedTestRemaining} = get();
        if (delayedTestRemaining) {
          const timeoutId = setTimeout(() => {
            updateHintText();
            set({
              delayedTestTimeout: null,
              delayedTestStartTime: null,
              delayedTestRemaining: null,
            });
          }, delayedTestRemaining);

          set({
            delayedTestTimeout: timeoutId,
            delayedTestStartTime: Date.now(),
          });
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          resumeTimer();
          store.handleVisibilityChange();
        } else {
          pauseTimer();
          store.handleVisibilityChange();
        }
      };

      // Initialize
      startTimer();
      window.addEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup function
      return () => {
        const {delayedTestTimeout} = get();
        if (delayedTestTimeout) {
          clearTimeout(delayedTestTimeout);
        }
        window.removeEventListener("visibilitychange", handleVisibilityChange);
        set({
          delayedTestTimeout: null,
          delayedTestStartTime: null,
          delayedTestRemaining: null,
        });
      };
    },
  })),
);

if (typeof window !== "undefined") {
  const globalAnimationCleanup = useAnimationStore
    .getState()
    .initializeGlobalAnimation();
  window.addEventListener("beforeunload", globalAnimationCleanup);
}
