"use client";

import Link from "next/link";
import {useCallback, useRef, useState} from "react";
import {ChevronLeft} from "lucide-react";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import {bn, formatUnits} from "fuels";

import {TransactionFailureModal} from "@/src/components/common";
import {createPoolKey, floorToTwoSignificantDigits} from "@/src/utils/common";
import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";
import RemoveLiquidityModalContent from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import RemoveLiquiditySuccessModal from "@/src/components/pages/view-position-page/components/RemoveLiquiditySuccessModal/RemoveLiquiditySuccessModal";

import {
  useRemoveLiquidity,
  usePositionData,
  useModal,
  useFormattedAddress,
  useCheckActiveNetwork,
  useAssetMetadata,
  usePoolAPR,
} from "@/src/hooks";

import {DesktopPositionView} from "./desktop-position-view";
import {MobilePositionView} from "./mobile-position-view";
import {DEFAULT_AMM_CONTRACT_ID, DefaultLocale} from "@/src/utils/constants";
import RemoveBinLiquidity from "../../../bin-liquidity/remove-bin-liquidity";

export function PositionView({pool}: {pool: PoolId}) {
  const [
    RemoveLiquidityModal,
    openRemoveLiquidityModal,
    closeRemoveLiquidityModal,
  ] = useModal();
  const [Modal, openModal, closeModal] = useModal();
  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const assetAMetadata = useAssetMetadata(pool[0].bits);
  const assetBMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];

  const {assets, lpTokenBalance} = usePositionData({pool});
  const {apr} = usePoolAPR(pool);

  const tvlValue = apr?.tvlUSD;
  const poolKey = createPoolKey(pool);
  const coinReserveA = apr?.reserve0;
  const coinReserveB = apr?.reserve1;

  const [removeLiquidityPercentage, setRemoveLiquidityPercentage] =
    useState(50);

  const [assetA, assetB] = assets || [
    [pool[0], bn(0)],
    [pool[1], bn(0)],
  ];

  const coinAAmount = formatUnits(assetA[1], assetAMetadata.decimals);

  const coinAAmountToWithdraw = assetA[1]
    .mul(bn(removeLiquidityPercentage))
    .div(bn(100));
  const coinAAmountToWithdrawStr = formatUnits(
    coinAAmountToWithdraw,
    assetAMetadata.decimals
  );

  const coinBAmount = formatUnits(assetB[1], assetBMetadata.decimals);

  const coinBAmountToWithdraw = assetB[1]
    .mul(bn(removeLiquidityPercentage))
    .div(bn(100));
  const coinBAmountToWithdrawStr = formatUnits(
    coinBAmountToWithdraw,
    assetBMetadata.decimals
  );

  const confirmationModalAssetsAmounts = useRef({
    firstAsset: coinAAmountToWithdrawStr,
    secondAsset: coinBAmountToWithdrawStr,
  });

  const {
    data,
    removeLiquidity,
    error: removeLiquidityError,
    isPending,
  } = useRemoveLiquidity({
    pool,
    liquidityPercentage: removeLiquidityPercentage,
    lpTokenBalance,
    coinAAmountToWithdraw,
    coinBAmountToWithdraw,
  });

  const handleWithdrawLiquidity = useCallback(() => {
    openRemoveLiquidityModal();
  }, [openRemoveLiquidityModal]);

  const handleWithdrawBinLiquidity = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleRemoveLiquidity = useCallback(async () => {
    try {
      const result = await removeLiquidity();
      if (result) {
        confirmationModalAssetsAmounts.current = {
          firstAsset: coinAAmountToWithdrawStr,
          secondAsset: coinBAmountToWithdrawStr,
        };
        closeRemoveLiquidityModal();
        openSuccessModal();
      }
    } catch (e) {
      closeRemoveLiquidityModal();
      openFailureModal();
    }
  }, [
    removeLiquidity,
    closeRemoveLiquidityModal,
    openSuccessModal,
    openFailureModal,
    coinAAmountToWithdrawStr,
    coinBAmountToWithdrawStr,
  ]);

  const rate = parseFloat(coinAAmount) / parseFloat(coinBAmount);
  const flooredRate =
    rate < 0.01
      ? floorToTwoSignificantDigits(rate).toLocaleString()
      : rate.toLocaleString(DefaultLocale, {minimumFractionDigits: 2});
  const makeRateFontSmaller = flooredRate.length > 10;

  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const isValidNetwork = useCheckActiveNetwork();

  const formattedTvlValue = tvlValue
    ? parseFloat(tvlValue?.toFixed(2)).toLocaleString()
    : "";

  const positionPath = getPoolNavigationUrl(pool, "add");

  return (
    <>
      <Link
        href="/liquidity"
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </Link>
      <MobilePositionView
        pool={pool}
        isStablePool={isStablePool}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: coinReserveA,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: coinReserveB,
        }}
        handleWithdrawLiquidity={handleWithdrawLiquidity}
      />
      <DesktopPositionView
        pool={pool}
        isStablePool={isStablePool}
        formattedTvlValue={formattedTvlValue}
        positionPath={positionPath}
        assetA={{
          amount: coinAAmount,
          metadata: assetAMetadata,
          reserve: coinReserveA,
        }}
        assetB={{
          amount: coinBAmount,
          metadata: assetBMetadata,
          reserve: coinReserveB,
        }}
        handleWithdrawLiquidity={handleWithdrawBinLiquidity}
      />

      <Modal
        useDefaultStyling={false}
        showCloseIcon={false}
        backdropClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        modalContainerClassName="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full lg:w-[563px] px-4 lg:px-0"
      >
        <RemoveBinLiquidity
          onClose={closeModal}
          assetA={{
            amount: coinAAmount,
            metadata: assetAMetadata,
            reserve: coinReserveA,
          }}
          assetB={{
            amount: coinBAmount,
            metadata: assetBMetadata,
            reserve: coinReserveB,
          }}
        />
      </Modal>

      <RemoveLiquidityModal
        title="Remove Liquidity"
        titleClassName="text-center"
      >
        <RemoveLiquidityModalContent
          coinA={pool[0].bits}
          coinB={pool[1].bits}
          isStablePool={isStablePool}
          currentCoinAValue={coinAAmount}
          currentCoinBValue={coinBAmount}
          coinAValueToWithdraw={coinAAmountToWithdrawStr}
          coinBValueToWithdraw={coinBAmountToWithdrawStr}
          closeModal={closeRemoveLiquidityModal}
          liquidityValue={removeLiquidityPercentage}
          setLiquidityValue={setRemoveLiquidityPercentage}
          handleRemoveLiquidity={handleRemoveLiquidity}
          isValidNetwork={isValidNetwork}
          isLoading={isPending}
        />
      </RemoveLiquidityModal>
      <SuccessModal title={<></>}>
        <RemoveLiquiditySuccessModal
          coinA={assetAMetadata.symbol || ""}
          coinB={assetBMetadata.symbol || ""}
          firstCoinAmount={confirmationModalAssetsAmounts.current.firstAsset}
          secondCoinAmount={confirmationModalAssetsAmounts.current.secondAsset}
          transactionHash={data?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>}>
        <TransactionFailureModal
          error={removeLiquidityError}
          closeModal={closeFailureModal}
        />
      </FailureModal>
    </>
  );
}
