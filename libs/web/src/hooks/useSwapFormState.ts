import {useState, useCallback} from "react";
import {B256Address} from "fuels";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {assetId: string | null; amount: string};
export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
type InputsState = Record<CurrencyBoxMode, {amount: string}>;

const initialInputsState: InputsState = {sell: {amount: ""}, buy: {amount: ""}};

export function useSwapFormState(
  initialSwapState: SwapState,
  isWidget?: boolean
) {
  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] =
    useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");

  const sellValue = inputsState.sell.amount;
  const buyValue = inputsState.buy.amount;

  const setSwapCoins = useCallback(
    (
      updater: (prev: {sell: string | null; buy: string | null}) => {
        sell: string | null;
        buy: string | null;
      }
    ) => {
      let stored: {sell: string | null; buy: string | null} | null = null;
      try {
        stored = JSON.parse(localStorage.getItem("swapCoins") ?? "null");
      } catch {
        // localStorage unavailable or corrupted data
      }
      const current = stored ?? {
        sell: initialSwapState.sell.assetId,
        buy: initialSwapState.buy.assetId,
      };
      const next = updater(current);
      try {
        localStorage.setItem("swapCoins", JSON.stringify(next));
      } catch {
        // localStorage unavailable
      }
    },
    [initialSwapState]
  );

  const swapAssets = useCallback(() => {
    setSwapState(({sell, buy}) => ({
      sell: {...buy},
      buy: {...sell},
    }));
    setInputsState(({sell, buy}) => ({
      sell: {...buy},
      buy: {...sell},
    }));
    setActiveMode("sell");
    if (!isWidget) {
      setSwapCoins(({sell, buy}) => ({sell: buy, buy: sell}));
      // Delay the glitch effect to ensure it captures the updated state
      setTimeout(() => {
        useAnimationStore.getState().handleMagicTripleClickToken();
      }, 0);
    }
  }, [isWidget, setSwapCoins]);

  const selectCoin = useCallback(
    (mode: CurrencyBoxMode) => (assetId: B256Address | null) => {
      const isDuplicate =
        (mode === "buy" && swapState.sell.assetId === assetId) ||
        (mode === "sell" && swapState.buy.assetId === assetId);
      if (isDuplicate) {
        swapAssets();
        return;
      }
      const amount = inputsState[mode].amount;
      setSwapState((prev) => ({
        ...prev,
        [mode]: {assetId, amount},
      }));
      setInputsState((prev) => ({
        ...prev,
        [mode]: {amount},
      }));
      if (!isWidget) {
        setSwapCoins((prev) => ({...prev, [mode]: assetId}));
      }
      setActiveMode(mode);
    },
    [inputsState, isWidget, setSwapCoins, swapAssets, swapState]
  );

  const setAmount = useCallback(
    (mode: CurrencyBoxMode) => (amount: string) => {
      if (!amount) {
        setSwapState((prev) => ({
          sell: {...prev.sell, amount: ""},
          buy: {...prev.buy, amount: ""},
        }));
        setInputsState(initialInputsState);
        setActiveMode(mode);
        return;
      }
      const other = mode === "buy" ? "sell" : "buy";
      setSwapState((prev) => ({
        ...prev,
        [mode]: {...prev[mode], amount},
        [other]: {...prev[other], amount: ""},
      }));
      setInputsState((prev) => ({
        ...prev,
        [mode]: {amount},
        [other]: {amount: ""},
      }));
      if (mode !== activeMode) {
        setActiveMode(mode);
      }
    },
    [activeMode]
  );

  const clearAmounts = useCallback(() => {
    setSwapState((prev) => ({
      sell: {...prev.sell, amount: ""},
      buy: {...prev.buy, amount: ""},
    }));
    setInputsState({sell: {amount: ""}, buy: {amount: ""}});
  }, []);

  const updateSwapStateAmount = useCallback(
    (mode: CurrencyBoxMode, amount: string) => {
      setSwapState((prev) => {
        const currentOpp = prev[mode].amount;
        if (currentOpp === amount) return prev;
        return {
          ...prev,
          [mode]: {
            ...prev[mode],
            amount,
          },
        };
      });

      setInputsState((prev) => {
        const currentOppInput = prev[mode].amount;
        if (currentOppInput === amount) return prev;
        return {
          ...prev,
          [mode]: {amount},
        };
      });
    },
    []
  );

  return {
    swapState,
    setSwapState,
    inputsState,
    activeMode,
    setActiveMode,
    sellValue,
    buyValue,
    swapAssets,
    selectCoin,
    setAmount,
    clearAmounts,
    updateSwapStateAmount,
  };
}
