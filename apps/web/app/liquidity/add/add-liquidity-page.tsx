"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useState, useCallback} from "react";
import {createPoolIdFromIdString} from "@/src/utils/common";
import PreviewAddLiquidityDialog, {
  AddLiquidityPreviewData,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import {IconButton} from "@/src/components/common";
import {CloseIcon} from "@/meshwave-ui/icons";
import {PoolId} from "mira-dex-ts";
import {SlippageSetting} from "@/src/components/common";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import {useModal} from "@/src/hooks";
import {
  DefaultSlippageValue,
  SlippageMode,
} from "@/src/components/common/Swap/Swap";
import {ChevronLeft} from "lucide-react";

export default function AddLiquidityPage() {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromIdString(poolKey) : null;

  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [previewData, setPreviewData] =
    useState<AddLiquidityPreviewData | null>(null);
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
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
    <main className="flex flex-col p-4 gap-4 lg:max-w-lg lg:mx-auto lg:px-4 lg:py-8">
      <button
        onClick={handleBackClick}
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </button>
      <section className="flex flex-col p-4 rounded-2xl gap-6 bg-background-grey-dark z-[5] w-full max-w-[524px] mx-auto">
        <div className="flex items-center w-full pb-4 border-b border-background-grey-light gap-2.5 font-medium text-sm leading-[19px] text-content-grey">
          <p className="flex-1 text-content-primary text-base font-medium">
            Add Liquidity
          </p>
          <SlippageSetting
            slippage={slippage}
            openSettingsModal={openSettingsModal}
          />
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
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

      <SettingsModal title="Settings">
        <SettingsModalContent
          slippage={slippage}
          slippageMode={slippageMode}
          setSlippage={setSlippage}
          setSlippageMode={setSlippageMode}
          closeModal={closeSettingsModal}
        />
      </SettingsModal>
    </main>
  );
}
