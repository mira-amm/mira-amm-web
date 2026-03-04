"use client";

import {useState, useCallback} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {ChevronLeft, X} from "lucide-react";

import PreviewAddLiquidityDialog, {
  AddLiquidityPreviewData,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import {IconButton, SlippageSetting} from "@/src/components/common";
import {useModal} from "@/src/hooks";

import {SlippageMode} from "@/src/components/common/Swap/Swap";
import SettingsModalContentNew from "@/src/components/common/settings-modal-content-new";
import {parsePoolKey} from "@/src/utils/poolTypeDetection";
import V2AddLiquidityDialog from "./components/V2AddLiquidityDialog";
import {BN} from "fuels";

export default function V2AddLiquidityPage() {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? parsePoolKey(poolKey) : null;

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
    <main className="flex flex-col gap-4 max-w-[563px] lg:min-w-[563px] mx-auto lg:py-8 w-full p-4 overflow-y-auto">
      <button
        onClick={handleBackClick}
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </button>
      <section className="flex flex-col p-4 rounded-ten gap-6 bg-background-grey-dark border-border-secondary border-[12px] z-[5] w-full max-w-[563px] mx-auto">
        <div className="flex items-center w-full pb-4 border-b border-background-grey-light gap-2.5  text-sm leading-[19px] text-content-grey">
          <p className="flex-1 text-content-primary text-lg">Add Liquidity</p>
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
          <V2AddLiquidityDialog
            poolId={poolId as BN}
            setPreviewData={setPreviewData}
            poolKey={poolKey || ""}
          />
        )}
      </section>

      {showPreview && (
        <div className="fixed top-0 left-0 w-full h-full backdrop-blur-sm z-[4] pointer-events-auto" />
      )}

      <SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
        <SettingsModalContentNew
          slippage={slippage}
          setSlippage={setSlippage}
          closeModal={closeSettingsModal}
        />
      </SettingsModal>
    </main>
  );
}
