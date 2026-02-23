import {useState, useCallback, useRef} from "react";
import {BN, ScriptTransactionRequest, TransactionResult} from "fuels";
import {triggerClassAnimation} from "@/src/components/common";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";
import type {SwapState} from "./useSwapFormState";

export function useSwapTransaction({
 fetchTxCost,
 triggerSwap,
 openSuccess,
 openFailure,
 refetchBalances,
 clearAmounts,
 swapState,
 swapButtonTitle,
 setSwapButtonTitle,
 sufficientEthBalance,
 amountMissing,
 swapPending,
 exchangeRate,
 review,
 setReview
}: {
  fetchTxCost: () => Promise<
    | {
    tx: ScriptTransactionRequest;
    txCost: BN;
  }
    | undefined
  >;
  triggerSwap: (tx: ScriptTransactionRequest) =>  Promise<{isStatusPreConfirmationSuccess: boolean, waitForResult: Promise<TransactionResult<void>>, id: string} | undefined>;
  openSuccess: () => void;
  openFailure: () => void;
  refetchBalances: () => Promise<unknown>;
  clearAmounts: () => void;
  swapState: SwapState;
  swapButtonTitle: string;
  setSwapButtonTitle: (title: string) => void;
  sufficientEthBalance: boolean;
  amountMissing: boolean;
  swapPending: boolean;
  exchangeRate: string | null;
  review: boolean;
  setReview: (review: boolean) => void;
}) {
  const [txCostData, setTxCostData] = useState<{
    tx: ScriptTransactionRequest;
    txCost: BN;
  }>();
  const [txCost, setTxCost] = useState<number | null>(null);
  const [customErrorTitle, setCustomErrorTitle] = useState<string>("");

  const swapStateForPreview = useRef<SwapState>(swapState);

  const fetchCost = useCallback(async () => {
    try {
      const data = await fetchTxCost();
      setTxCostData(data);

      if (data?.txCost) {
        setTxCost(data.txCost.toNumber() / 10 ** 9);
      } else {
        setTxCost(null);
      }

      setCustomErrorTitle("");
    } catch (e) {
      console.error(e);
      setCustomErrorTitle("Review failed, please try again");
      setTxCost(null);
      setReview(false);
      setSwapButtonTitle("Review");
      openFailure();
    }
  }, [fetchTxCost, openFailure, setSwapButtonTitle]);

  const handleSwapClick = useCallback(async () => {
    if (swapButtonTitle === "Review") {
      setReview(true);
      setSwapButtonTitle("Swap");
      fetchCost();
      return;
    }
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true`);
      return;
    }
    if (amountMissing || swapPending || exchangeRate === null) return;

    swapStateForPreview.current = swapState;
    try {
      if (txCostData?.tx) {
        const result = await triggerSwap(txCostData.tx);
        if (result?.isStatusPreConfirmationSuccess) {
          // Preserve current asset selection, only clear amounts
          clearAmounts();
          setReview(false);
          openSuccess();
          triggerClassAnimation("dino");
          await refetchBalances();
          await result.waitForResult;
        }
      } else {
        openFailure();
      }
    } catch (e) {
      console.error(e);
      if (!(e instanceof Error) || !e.message.includes("User canceled")) {
        openFailure();
        setSwapButtonTitle("Swap");
      }
    }
  }, [
    swapButtonTitle,
    sufficientEthBalance,
    amountMissing,
    swapPending,
    exchangeRate,
    swapState,
    txCostData,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances,
    fetchCost,
    clearAmounts,
    setSwapButtonTitle,
  ]);

  return {
    txCost,
    txCostData,
    review,
    setReview,
    customErrorTitle,
    handleSwapClick,
    swapStateForPreview,
  };
}
