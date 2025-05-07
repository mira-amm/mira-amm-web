# Animation Trigger System Documentation

## High-Level Flow

**Initial State**:  
All animation progress is stored in `animationCalls` and `animationCallCount`, persisted via `localStorage`.

### Trigger System

Three unique user interactions must be performed in sequence:

1. Triple-click on **Swap** icon.
2. Input `"19.85"` into an input field.
3. Triple-click on **currency swap (exchange rate)**.

Each success:

- Triggers a visual/audio effect.
- Advances the animation progress & updates count.
- Starts the next hint timer.

### Global Animation Loop

- Background glitch animations trigger every **30 seconds** (in dev environment. Update this for production).
- Stops after all 3 interactions are completed.

### Hints

- Timed hints are displayed based on the user’s current step.
- Each hint is for the next step.
- Hints start around **5 min** after the user enters the site and disappear once the game is complete.

---

## Store

### Done with Zustand

- **Persist**: Saves `animationCalls` and `animationCallCount` in `localStorage`.
- **subscribeWithSelector**: Enables efficient state subscriptions.

---

## Trigger System Functions

1. `subscribe(callback: AnimationTrigger): () => void`  
   Registers a function to be called when `triggerAnimations()` is fired. Returns an unsubscribe function.

2. `triggerAnimations(): void`  
   Calls all subscribers registered via `subscribe()`. Triggers any glitch effects, scanlines, or CSS animations.

3. `getAnimationCallCount(): number`  
   Returns how many of the 3 steps have been completed.

4. `resetAnimationCalls(): void`  
   Clears all animation progress.  
   Resets `animationCalls`, `animationCallCount`, and toggles.  
   Used for debugging or allowing the user to restart the experience.

---

## Interaction Handlers

5. `handleMagicTripleClickToken(): void`

   - Detects 3 rapid Swap clicks within 1 second.
   - When `animationCallCount === 0`:
     - Triggers `ScrambleEffect()`.
     - Sets `animationCalls.tripleClickTokenSwap = true`.
     - Increments count.
     - Starts a hint timer for `HINT_2`.

6. `handleMagicInput(value: string): void`

   - If slippage string equals `"19.85"`:
     - Triggers `GlitchAndScanLines()` and `playRadioAudio()`.
     - Increments count.
     - Starts hint timer for `HINT_3`.

7. `handleMagicTripleClickCurrency(): void`
   - Detects 3 clicks on currency exchange within 1 second.
   - When `animationCallCount === 2`:
     - Triggers rainbow animation.
     - Sets `animationCalls.tripleClickCurrencySwap = true`.
     - Increments count.
     - Clears hint (no more hints, game complete).

---

## Audio Functions

8. `playRadioAudio(): void`

   - Plays `radio-audio.mp3` at volume: `0.7`.
   - Can be muted using the mute icon.
   - Sets a timeout to stop after 8 seconds.
   - On end:
     - Sets `isRadioPlaying = false`.

9. `stopRadioAudio(): void`
   - Immediately stops playback and clears timeout.
   - Sets `isRadioPlaying = false`.

---

## Global Glitch Loop

10. `startPeriodicGlobalAnimation(): void`

    - Runs every 30 seconds (update interval for production).
    - Alternates between `GlitchAndScanLines()` and `dino`.
    - Stops automatically after all 3 steps are completed.

11. `stopPeriodicGlobalAnimation(): void`

    - Clears the global animation interval.
    - Called when `animationCallCount === 3`.

12. `handleVisibilityChange(): void`
    - If the page is hidden (user switches tabs): Pauses global animation.
    - If visible again: Resumes animation if `animationCallCount < 3`.

---

## Initialization

13. `initializeGlobalAnimation(): () => void`
    - Sets up both global animation and the first hint.
    - Hooks into tab visibility to pause/resume animation.
    - Returns cleanup function to:
      - Stop animations.
      - Remove listeners.

---

## 💡 Hint System

14. `initializeHintListener(count?: number = animationCallCount): () => void`
    - Delays hint based on progress step:
      - **HINT_1**: 5-minute delay.
      - **HINT_2**: 10-second delay.
      - **HINT_3**: 10-second delay.
    - Tracks elapsed time across visibility changes.

---

## LocalStorage Keys Used

| Key               | Purpose                              |
| ----------------- | ------------------------------------ |
| `animation-calls` | Tracks which triggers are completed. |
| `animation-count` | Tracks total number of completions.  |

---

## Example Use

```ts
const handleClick = () => {
  useAnimationStore.getState().handleMagicTripleClickToken();
};

useEffect(() => {
  const cleanup = useAnimationStore.getState().initializeGlobalAnimation();
  return cleanup;
}, []);
```

---

## Effects Files

**Path**: `/libs/web/src/components/common/GlitchEffects/*`

There are 3 major effects. They can be triggered independently from anywhere. These do not interfere with DOM elements.

1. **Scramble**

   - Triggered when `animationCallCount` becomes **1**.
   - Duration: Under **3 seconds**.
   - Changes the **text content of all text nodes**, then returns them to their default values.

2. **Glitch ScanLines and Audio**

   - Triggered when `animationCallCount` becomes **2**.
   - Sequence:
     - **Glitch** effect lasts around **2 seconds**.
     - Then triggers **Scanlines** for **2 seconds**.
     - During a **500ms** transition, both effects are visible.
   - Total visual duration: **3.5 seconds**.
   - The associated **audio plays for 8 seconds** and can be muted to skip the wait and trigger the next animation sooner.

3. **Rainbow**
   - Triggered when `animationCallCount` becomes **3**.
   - Implemented using **CSS and filters**.
   - The filter applies a **pixelated visual effect** to the UI.

---
