"use client";

import BackLink from "@/src/components/common/BackLink/BackLink";

import StatusModal, {ModalType} from "@/src/components/common/StatusModal";

import RemoveLiquidityModalContent from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import useModal from "@/src/hooks/useModal/useModal";
import usePositionData from "@/src/hooks/usePositionData";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import {createPoolKey} from "@/src/utils/common";
import {FuelError} from "fuels";
import {useRouter} from "next/navigation";
import {useCallback, useRef, useState} from "react";
import styles from "./PositionView.module.css";

import {PoolId} from "mira-dex-ts";

import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePoolAPR from "@/src/hooks/usePoolAPR";

import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {bn, formatUnits} from "fuels";

import DesktopPositionView from "./DesktopPositionView/DesktopPositionView";
import MobilePositionView from "./MobilePositionView/MobilePositionView";

type Props = {
  pool: PoolId;
};

const PositionView = ({pool}: Props): JSX.Element => {
  const [
    RemoveLiquidityModal,
    openRemoveLiquidityModal,
    closeRemoveLiquidityModal,
  ] = useModal();
  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal] = useModal();

  const router = useRouter();
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
    assetAMetadata.decimals,
  );

  const coinBAmount = formatUnits(assetB[1], assetBMetadata.decimals);

  const coinBAmountToWithdraw = assetB[1]
    .mul(bn(removeLiquidityPercentage))
    .div(bn(100));
  const coinBAmountToWithdrawStr = formatUnits(
    coinBAmountToWithdraw,
    assetBMetadata.decimals,
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

  const redirectToLiquidity = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const isValidNetwork = useCheckActiveNetwork();

  const formattedTvlValue = tvlValue
    ? parseFloat(tvlValue?.toFixed(2)).toLocaleString()
    : "";

  const positionPath = `/liquidity/add?pool=${poolKey}`;

  const calculateMessages = () => {
    const successMessage = `Removed ${confirmationModalAssetsAmounts.current.firstAsset} ${assetAMetadata.symbol} and ${confirmationModalAssetsAmounts.current.secondAsset} ${assetBMetadata.symbol} from your position`;

    let errorMessage: string;
    if (removeLiquidityError instanceof FuelError) {
      errorMessage = removeLiquidityError.message;
    } else {
      errorMessage =
        "An error occurred while processing your request. Please try again or contact support if the issue persists.";
    }

    return [successMessage, errorMessage];
  };

  const [successModalSubtitle, errorModalSubtitle] = calculateMessages();

  return (
    <>
      <BackLink showOnDesktop href="/liquidity" chevron title="Back to Pool" />
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
        handleWithdrawLiquidity={handleWithdrawLiquidity}
      />

      <RemoveLiquidityModal
        title="Remove Liquidity"
        titleClassName={styles.withdrawLiquidityTitle}
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
      <SuccessModal title={<></>} onClose={redirectToLiquidity}>
        <StatusModal
          type={ModalType.SUCCESS}
          transactionHash={data?.id}
          subTitle={successModalSubtitle}
          title="Removed liquidity successfully"
        />
      </SuccessModal>
      <FailureModal title={<></>}>
        <StatusModal
          type={ModalType.ERROR}
          subTitle={errorModalSubtitle}
          title="Failed to remove liquidity"
        />
      </FailureModal>
    </>
  );
};

export default PositionView;
