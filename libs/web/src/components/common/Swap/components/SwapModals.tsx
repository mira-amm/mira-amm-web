import {
  CoinsListModal,
  SwapSuccessModal,
  SwapFailureModal,
  FeatureGuard,
  SettingsModalContent,
} from "@/src/components/common";
import SettingsModalContentNew from "../../settings-modal-content-new";
import type {SwapState, SlippageMode} from "@/src/hooks";
import type {Dispatch, SetStateAction, RefObject} from "react";

export function SwapModals({
  modals,
  slippage,
  slippageMode,
  setSlippage,
  setSlippageMode,
  balances,
  handleCoinSelection,
  swapStateForPreview,
  swapResult,
  txCostError,
  swapError,
  resetSwapErrors,
  customErrorTitle,
}: {
  modals: {
    SettingsModal: any;
    closeSettingsModal: () => void;
    CoinsModal: any;
    SuccessModal: any;
    FailureModal: any;
    closeFailureModal: () => void;
  };
  slippage: number;
  slippageMode: SlippageMode;
  setSlippage: Dispatch<SetStateAction<number>>;
  setSlippageMode: Dispatch<SetStateAction<SlippageMode>>;
  balances: any[] | undefined;
  handleCoinSelection: (assetId: string | null) => void;
  swapStateForPreview: RefObject<SwapState>;
  swapResult: {id: string} | null | undefined;
  txCostError: any;
  swapError: any;
  resetSwapErrors: () => void;
  customErrorTitle: string;
}) {
  return (
    <>
      <FeatureGuard
        fallback={
          <modals.SettingsModal title="Settings">
            <SettingsModalContent
              slippage={slippage}
              slippageMode={slippageMode}
              setSlippage={setSlippage}
              setSlippageMode={setSlippageMode}
              closeModal={modals.closeSettingsModal}
            />
          </modals.SettingsModal>
        }
      >
        <modals.SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
          <SettingsModalContentNew
            slippage={slippage}
            setSlippage={setSlippage}
            closeModal={modals.closeSettingsModal}
          />
        </modals.SettingsModal>
      </FeatureGuard>

      <modals.CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
      </modals.CoinsModal>

      <modals.SuccessModal title={<></>}>
        <SwapSuccessModal
          swapState={swapStateForPreview.current}
          transactionHash={swapResult?.id}
        />
      </modals.SuccessModal>

      <modals.FailureModal title={<></>} onClose={resetSwapErrors}>
        <SwapFailureModal
          error={txCostError || swapError}
          closeModal={modals.closeFailureModal}
          customTitle={customErrorTitle}
        />
      </modals.FailureModal>
    </>
  );
}
