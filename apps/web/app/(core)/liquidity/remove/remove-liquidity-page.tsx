"use client";

import {useState, useCallback} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {ChevronLeft, X} from "lucide-react";
import {PoolId} from "mira-dex-ts";
import {createPoolIdFromIdString} from "@/src/utils/common";
import RemoveLiquidityModalContent from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import RemoveLiquiditySuccessModal from "@/src/components/pages/view-position-page/components/RemoveLiquiditySuccessModal/RemoveLiquiditySuccessModal";
import {
  SlippageSetting,
  TransactionFailureModal,
} from "@/src/components/common";
import {useModal} from "@/src/hooks";
import {bn, formatUnits} from "fuels";
import {
  useRemoveLiquidity,
  usePositionData,
  useAssetMetadata,
  useCheckActiveNetwork,
} from "@/src/hooks";
import SettingsModalContentNew from "@/src/components/common/settings-modal-content-new";

export default function RemoveLiquidityPage() {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromIdString(poolKey) : null;

  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();
  const [slippage, setSlippage] = useState<number>(100);
  const [liquidityValue, setLiquidityValue] = useState<number>(50);

  const handleBackClick = useCallback(() => {
    router.back();
  }, [router]);

  if (!poolId) {
    router.push("/liquidity");
    return null;
  }

  const assetAMetadata = useAssetMetadata(poolId[0].bits);
  const assetBMetadata = useAssetMetadata(poolId[1].bits);

  const isStablePool = poolId[2];

  const {assets, lpTokenBalance} = usePositionData({pool: poolId as PoolId});
  const [assetA, assetB] = assets || [
    [poolId[0], bn(0)],
    [poolId[1], bn(0)],
  ];

  const coinAAmount = formatUnits(assetA[1], assetAMetadata.decimals);
  const coinBAmount = formatUnits(assetB[1], assetBMetadata.decimals);

  const coinAAmountToWithdraw = assetA[1].mul(bn(liquidityValue)).div(bn(100));
  const coinAAmountToWithdrawStr = formatUnits(
    coinAAmountToWithdraw,
    assetAMetadata.decimals
  );

  const coinBAmountToWithdraw = assetB[1].mul(bn(liquidityValue)).div(bn(100));
  const coinBAmountToWithdrawStr = formatUnits(
    coinBAmountToWithdraw,
    assetBMetadata.decimals
  );

  const {data, removeLiquidity, error, isPending} = useRemoveLiquidity({
    pool: poolId as PoolId,
    liquidityPercentage: liquidityValue,
    lpTokenBalance,
    coinAAmountToWithdraw,
    coinBAmountToWithdraw,
  });

  const handleRemoveLiquidity = useCallback(async () => {
    try {
      const result = await removeLiquidity();
      if (result) {
        openSuccessModal();
      }
    } catch (e) {
      openFailureModal();
    }
  }, [removeLiquidity, openSuccessModal, openFailureModal]);

  const isValidNetwork = useCheckActiveNetwork();

  return (
    <main className="flex flex-col gap-4 max-w-[563px] lg:min-w-[563px] mx-auto lg:py-8 w-full p-4">
      <button
        onClick={handleBackClick}
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </button>
      <section className="flex flex-col p-4 rounded-ten gap-6 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark z-[5] w-full max-w-[563px] mx-auto">
        <div className="flex items-center w-full pb-4 border-b border-background-grey-light gap-2.5  text-sm leading-[19px] text-content-grey">
          <p className="flex-1 text-content-primary text-base ">
            Remove Liquidity
          </p>
          <SlippageSetting
            slippage={slippage}
            openSettingsModal={openSettingsModal}
          />
        </div>

        <RemoveLiquidityModalContent
          coinA={poolId[0].bits}
          coinB={poolId[1].bits}
          isStablePool={isStablePool}
          currentCoinAValue={coinAAmount}
          currentCoinBValue={coinBAmount}
          coinAValueToWithdraw={coinAAmountToWithdrawStr}
          coinBValueToWithdraw={coinBAmountToWithdrawStr}
          closeModal={() => {}}
          liquidityValue={liquidityValue}
          setLiquidityValue={setLiquidityValue}
          handleRemoveLiquidity={handleRemoveLiquidity}
          isValidNetwork={isValidNetwork}
          isLoading={isPending}
        />
      </section>

      <SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
        <SettingsModalContentNew
          slippage={slippage}
          setSlippage={setSlippage}
          closeModal={closeSettingsModal}
        />
      </SettingsModal>

      <SuccessModal title={<></>}>
        <RemoveLiquiditySuccessModal
          coinA={assetAMetadata.symbol || ""}
          coinB={assetBMetadata.symbol || ""}
          firstCoinAmount={coinAAmountToWithdrawStr}
          secondCoinAmount={coinBAmountToWithdrawStr}
          transactionHash={data?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>}>
        <TransactionFailureModal error={error} closeModal={closeFailureModal} />
      </FailureModal>
    </main>
  );
}
