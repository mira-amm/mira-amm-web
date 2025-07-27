"use client";

import {useState, useCallback} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {ChevronLeft, X} from "lucide-react";

import {createPoolIdFromIdString} from "@/src/utils/common";
import PreviewAddLiquidityDialog, {
  AddLiquidityPreviewData,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import {PoolId} from "mira-dex-ts";
import {
  IconButton,
  FeatureGuard,
  SettingsModalContent,
  SlippageSetting,
} from "@/src/components/common";
import {useModal} from "@/src/hooks";

import {SlippageMode} from "@/src/components/common/Swap/Swap";
import SettingsModalContentNew from "@/src/components/common/settings-modal-content-new";

export default function AddLiquidityPage() {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromIdString(poolKey) : null;

  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [previewData, setPreviewData] =
    useState<AddLiquidityPreviewData | null>(null);
  const [slippage, setSlippage] = useState<number>(100);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  if (!poolId) {
    router.push("/liquidity");
    return null;
  }

  const showPreview = Boolean(previewData);

  return (
    <main className="flex flex-col gap-4  max-w-lg lg:min-w-lg mx-auto lg:py-8 w-full p-4">
      <button
        onClick={handleBackClick}
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </button>
      <section className="flex flex-col p-4 rounded-ten gap-6 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark z-[5] w-full max-w-[524px] mx-auto">
        <div className="flex items-center w-full pb-4 border-b border-background-grey-light gap-2.5  text-sm leading-[19px] text-content-grey">
          <p className="flex-1 text-content-primary text-base ">
            Add Liquidity
          </p>
          <SlippageSetting
            slippage={slippage}
            openSettingsModal={openSettingsModal}
          />
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <X />
            </IconButton>
          )}
        </div>

        {showPreview ? (
          <PreviewAddLiquidityDialog
            previewData={previewData!}
            setPreviewData={setPreviewData}
            slippage={slippage}
          />
        ) : (
          <AddLiquidityDialog
            poolId={poolId as PoolId}
            setPreviewData={setPreviewData}
            poolKey={poolKey || ""}
          />
        )}
      </section>

      {showPreview && (
        <div className="fixed top-0 left-0 w-full h-full backdrop-blur-sm z-[4] pointer-events-auto" />
      )}

      <FeatureGuard
        fallback={
          <SettingsModal title="Settings">
            <SettingsModalContent
              slippage={slippage}
              slippageMode={slippageMode}
              setSlippage={setSlippage}
              setSlippageMode={setSlippageMode}
              closeModal={closeSettingsModal}
            />
          </SettingsModal>
        }
      >
        <SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
          <SettingsModalContentNew
            slippage={slippage}
            setSlippage={setSlippage}
            closeModal={closeSettingsModal}
          />
        </SettingsModal>
      </FeatureGuard>
    </main>
  );
}
