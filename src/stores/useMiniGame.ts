import {create} from "zustand";
import {subscribeWithSelector} from "zustand/middleware";
import {TextScramble} from "../utils/textScrambler";
import {playAudioEffect} from "../utils/playAudioEffect";

const HINT_1 = "Rwrarrw, careful how fast you switch those assets!";
const HINT_2 = "Slippage is so low these days, it feels great to live in 1985.";
const HINT_3 =
  " Easy there, Gordon Gecko. If you keep switching these prices, the market will tank.";

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

  hintText: string;
  delayedTestTimeout: NodeJS.Timeout | null;
  delayedTestStartTime: number | null;
  delayedTestRemaining: number | null;

  subscribe: (callback: AnimationTrigger) => () => void;
  triggerAnimations: () => void;
  getAnimationCallCount: () => number;
  handleMagicTripleClickToken: () => void;
  handleMagicInput: (value: string) => void;
  handleMagicTripleClickCurrency: () => void;
  resetAnimationCalls: () => void;

  startPeriodicGlobalAnimation: () => void;
  stopPeriodicGlobalAnimation: () => void;
  triggerClassAnimation: (classname: string, duration: number) => void;
  handleVisibilityChange: () => void;
  initializeGlobalAnimation: () => () => void;
  triggerTextScrambler: () => void;
  playRadioAudio: () => void;

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

    playRadioAudio: () => {
      playAudioEffect("/audio/radio-audio.mp3", {
        volume: 0.7,
      });
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
          get().triggerTextScrambler();
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

        set({
          calledAnimations: newCalledAnimations,
          animationCallCount: newCount,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(
            ANIMATION_CALLS_KEY,
            JSON.stringify(newCalledAnimations),
          );
          localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
        }

        initializeHintListener(newCount);
        get().subscribers.push(animationSubscriber);
        get().triggerAnimations();
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
          get().triggerClassAnimation("glitchLayer", 5000);
          playRadioAudio();
          set((state) => ({
            subscribers: state.subscribers.filter(
              (sub) => sub !== magicNumberSubscriber,
            ),
          }));
        };

        // Update call tracking
        const newCalledAnimations = {...calledAnimations, magicInput: true};
        const newCount = animationCallCount + 1;

        set({
          calledAnimations: newCalledAnimations,
          animationCallCount: newCount,
          inputBuffer: "",
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(
            ANIMATION_CALLS_KEY,
            JSON.stringify(newCalledAnimations),
          );
          localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
        }

        initializeHintListener(newCount);
        set((state) => ({
          subscribers: [...state.subscribers, magicNumberSubscriber],
        }));
        get().triggerAnimations();
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
          get().triggerClassAnimation("rainbowColor", 7000);
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

        set({
          calledAnimations: newCalledAnimations,
          animationCallCount: newCount,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(
            ANIMATION_CALLS_KEY,
            JSON.stringify(newCalledAnimations),
          );
          localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
        }

        initializeHintListener(newCount);
        get().subscribers.push(animationSubscriber);
        get().triggerAnimations();
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
          get().triggerClassAnimation("glitchLayer", 5000);
        } else {
          get().triggerClassAnimation("dino", 2000);
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

    triggerClassAnimation: (classname: string, duration: number) => {
      if (typeof window === "undefined") return;
      const glitchElements = document.querySelectorAll(`.${classname}`);
      glitchElements.forEach((el) => {
        (el as HTMLElement).style.display = "block";
      });

      const timeoutId = setTimeout(() => {
        glitchElements.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      }, duration);

      return () => clearTimeout(timeoutId);
    },

    triggerTextScrambler: () => {
      const elements = document.querySelectorAll("body *");

      elements.forEach((el) => {
        const text = el.childNodes;
        let visibleText = "";

        text.forEach((node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent?.trim().length ?? 0) > 0
          ) {
            visibleText += node.textContent?.trim() + " ";
          }
        });

        if (visibleText.trim().length > 0) {
          const scrambleTarget = document.createElement("span");
          scrambleTarget.textContent = visibleText.trim();

          // Replace text nodes only, keep nested HTML (like <button>) intact
          el.childNodes.forEach((node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              (node.textContent?.trim().length ?? 0) > 0
            ) {
              el.replaceChild(scrambleTarget, node);
            }
          });

          const textScramble = new TextScramble(scrambleTarget);
          textScramble.setText(scrambleTarget.innerText);
        }
      });
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
      };

      const startTimer = () => {
        // const delay = 5 * 60 * 1000; // 5 minutes
        const delay = 10 * 1000; // 10 seconds
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
