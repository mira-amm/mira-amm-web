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

// Timeout constants
const CLICK_DETECTION_WINDOW = 1000; // 1 second window for detecting rapid clicks
const TOKEN_ANIMATION_DELAY = 3500; // Delay before updating animation state
const OTHER_ANIMATION_DELAY = 4500; // Delay for magic input animation & exchange swap
const GLOBAL_ANIMATION_INTERVAL = 60000; // 1 min between global animations
const FIRST_HINT_DELAY = 5 * 60 * 1000; // 5 minutes before first hint
const SUBSEQUENT_HINT_DELAY = 10 * 1000; // 10 seconds before subsequent hints

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
  isAnimationInProgress: boolean;

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
    masterEnabled:
      process.env.NEXT_PUBLIC_ENABLE_GLITCH_SCAVENGER_HUNT === "true",
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
    isAnimationInProgress: false,

    // Play the radio audio effect for 8 seconds and is triggered along with the magic input. Can be muted by clicking the radio icon.
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

    // Stop the radio audio effect and set isRadioPlaying to false. The speaker icon visibility is handled based on the isRadioPlaying state.
    stopRadioAudio: () => {
      stopCurrentAudio();
      set({isRadioPlaying: false});
    },

    // Calls all registered animation subscriber functions. Used to run UI effects from external logic.
    triggerAnimations: () => {
      if (!get().masterEnabled) return;
      get().subscribers.forEach((cb) => cb());
    },

    getAnimationCallCount: () => {
      return get().animationCallCount;
    },

    // Handles the magic triple click on the token. If the user clicks the token 3 times within 1 second, it triggers the ScrambleEffect.
    // Triggers a scramble effect.
    // Registers the effect and updates progress state.
    // Queues hint #1 to show after a delay.
    // Progress Requirement: Only runs when animationCallCount === 0. Then updates to 1.
    handleMagicTripleClickToken: () => {
      const {
        masterEnabled,
        toggles,
        isAnimationInProgress,
        lastClicks,
        calledAnimations,
        animationCallCount,
        initializeHintListener,
      } = get();
      if (
        !masterEnabled ||
        !toggles.tripleClickToken ||
        isAnimationInProgress ||
        calledAnimations.tripleClickTokenSwap ||
        animationCallCount !== 0
      )
        return;

      const now = Date.now();
      const recentClicks = lastClicks.filter(
        (t) => now - t < CLICK_DETECTION_WINDOW,
      );

      if (recentClicks.length >= 2) {
        set({lastClicks: []});

        const animationSubscriber = () => {
          set({isAnimationInProgress: true});
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

        // Update the values only after the user sees the effect.
        setTimeout(() => {
          set({
            calledAnimations: newCalledAnimations,
            animationCallCount: newCount,
            isTriggeredManually: true,
            isAnimationInProgress: false,
          });
          initializeHintListener(newCount);

          if (typeof window !== "undefined") {
            localStorage.setItem(
              ANIMATION_CALLS_KEY,
              JSON.stringify(newCalledAnimations),
            );
            localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
          }
        }, TOKEN_ANIMATION_DELAY);
      } else {
        set({lastClicks: [...recentClicks, now]});
      }
    },

    // Checks if slippage value matches "19.85". If it does:
    // Triggers scanlines and plays radio audio.
    // Updates progress once the audio finishes / user mutes.
    // Progress Requirement: Only runs when animationCallCount === 1.
    handleMagicInput: (value: string) => {
      const {
        masterEnabled,
        toggles,
        isAnimationInProgress,
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
        isAnimationInProgress ||
        animationCallCount !== 1
      )
        return;

      const newBuffer = (inputBuffer + value).slice(-5).replace(/[^0-9.]/g, "");
      set({inputBuffer: newBuffer});

      if (newBuffer === "19.85") {
        const magicNumberSubscriber = () => {
          set({isAnimationInProgress: true});
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
                isAnimationInProgress: false,
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
        }, OTHER_ANIMATION_DELAY);
      }
    },

    // Detects 3 rapid clicks on swap currency area within 1 second. If valid:
    // Triggers a rainbow CSS class animation.
    // Updates animation progress and queues hint #3.
    // Progress Requirement: Only runs when animationCallCount === 2.
    handleMagicTripleClickCurrency: () => {
      const {
        masterEnabled,
        toggles,
        isAnimationInProgress,
        lastClicks,
        calledAnimations,
        animationCallCount,
        initializeHintListener,
      } = get();
      if (
        !masterEnabled ||
        !toggles.tripleClickCurrency ||
        isAnimationInProgress ||
        calledAnimations.tripleClickCurrencySwap ||
        animationCallCount !== 2
      )
        return;

      const now = Date.now();
      const recentClicks = lastClicks.filter(
        (t) => now - t < CLICK_DETECTION_WINDOW,
      );

      if (recentClicks.length >= 2) {
        set({lastClicks: []});

        const animationSubscriber = () => {
          triggerClassAnimation("rainbowColor");
          set({isAnimationInProgress: true});
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
            isAnimationInProgress: false,
          });
          initializeHintListener(newCount);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              ANIMATION_CALLS_KEY,
              JSON.stringify(newCalledAnimations),
            );
            localStorage.setItem(ANIMATION_COUNT_KEY, newCount.toString());
          }
        }, OTHER_ANIMATION_DELAY);
      } else {
        set({lastClicks: [...recentClicks, now]});
      }
    },

    // Resets all animation progress, localStorage state, and manual trigger flags. Useful for debugging or restarting the experience.
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
        isAnimationInProgress: false,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(
          ANIMATION_CALLS_KEY,
          JSON.stringify(defaultCalled),
        );
        localStorage.setItem(ANIMATION_COUNT_KEY, "0");
      }
    },

    // Begins a 30-second interval loop alternating between glitch effects and CSS class animations.
    // Stops automatically once all 3 animations are completed.
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
      }, GLOBAL_ANIMATION_INTERVAL); // 30 second interval

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

    // Starts a delayed timer that shows a contextual hint after a delay (shortened for dev purposes). It:
    // Pauses when the tab is inactive. Resumes when the tab is active.
    // Shows one of three predefined hints based on progress.
    // Returns a cleanup function to stop the timer and remove event listeners.
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
        const delay = count === 0 ? FIRST_HINT_DELAY : SUBSEQUENT_HINT_DELAY; // 10 seconds
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
