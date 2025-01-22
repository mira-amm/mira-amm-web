"use client";

import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from "./PositionView.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useModal from "@/src/hooks/useModal/useModal";
import RemoveLiquidityModalContent from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import usePositionData from "@/src/hooks/usePositionData";
import {floorToTwoSignificantDigits, createPoolKey} from "@/src/utils/common";
import {useCallback, useRef, useState} from "react";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import {useRouter} from "next/navigation";
import RemoveLiquiditySuccessModal from "@/src/components/pages/view-position-page/components/RemoveLiquiditySuccessModal/RemoveLiquiditySuccessModal";
import IconButton from "@/src/components/common/IconButton/IconButton";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID, DefaultLocale} from "@/src/utils/constants";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import LogoIcon from "@/src/components/icons/Logo/LogoIcon";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import {CopyIcon} from "@/src/components/icons/Copy/CopyIcon";
import {bn, formatUnits} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";

type Props = {
  pool: PoolId;
};

const formatDisplayAmount = (amount: string) => {
  const asDecimal = parseFloat(amount);
  if (asDecimal < 0.00001) {
    return "<0.00001";
  }

  return asDecimal.toLocaleString(DefaultLocale, {minimumFractionDigits: 5});
};

const PositionView = ({pool}: Props) => {
  const [
    RemoveLiquidityModal,
    openRemoveLiquidityModal,
    closeRemoveLiquidityModal,
  ] = useModal();
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const router = useRouter();
  const assetAMetadata = useAssetMetadata(pool[0].bits);
  const assetBMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];

  const {assets, lpTokenBalance} = usePositionData({pool});
  const {apr} = usePoolAPR(pool);
  const aprValue = apr
    ? `${apr.apr.toLocaleString(DefaultLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    : null;

  const tvlValue = apr?.tvlUSD;
  const poolKey = createPoolKey(pool);

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

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
      console.error(e);
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

  const rate = parseFloat(coinAAmount) / parseFloat(coinBAmount);
  const flooredRate =
    rate < 0.01
      ? floorToTwoSignificantDigits(rate).toLocaleString()
      : rate.toLocaleString(DefaultLocale, {minimumFractionDigits: 2});
  const makeRateFontSmaller = flooredRate.length > 10;

  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const isValidNetwork = useCheckActiveNetwork();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
  }, [lpTokenAssetId.bits]);

  const lpTokenDisplayValue = formatUnits(lpTokenBalance || "0", 9);

  return (
    <>
      <BackLink showOnDesktop href="/liquidity" title="Back to Pool" />
      <section className={clsx(styles.contentSection, "mobileOnly")}>
        <div className={styles.coinPairAndLabel}>
          <CoinPair
            firstCoin={pool[0].bits}
            secondCoin={pool[1].bits}
            withFeeBelow
            isStablePool={isStablePool}
          />
          <PositionLabel />
        </div>
        <div className={styles.infoBlock}>
          <p>Liquidity</p>
          {isMatching ? (
            <div className={styles.aprBadge}>
              <p>APR &nbsp;</p>
              <AprBadge
                aprValue={aprValue}
                poolKey={poolKey}
                tvlValue={tvlValue}
                small={true}
              />
            </div>
          ) : (
            <p>
              APR &nbsp;
              <span
                className={clsx(styles.pending, !aprValue && "blurredText")}
              >
                {aprValue ?? "33.33%"}
              </span>
            </p>
          )}
          <div className={styles.coinsData}>
            <CoinWithAmount
              assetId={pool[0].bits}
              amount={formatDisplayAmount(coinAAmount)}
            />
            <CoinWithAmount
              assetId={pool[1].bits}
              amount={formatDisplayAmount(coinBAmount)}
            />
          </div>
        </div>
        <div className={styles.miraBlock}>
          <div className={styles.miraLogo}>
            <LogoIcon />
          </div>
          <p className={styles.tokenDisplayValue}>
            {lpTokenDisplayValue} LP tokens
          </p>
          <p className={styles.numberAndCopy}>
            Asset ID: {formattedLpTokenAssetId}
            <IconButton onClick={handleCopy}>
              <CopyIcon />
            </IconButton>
          </p>
        </div>
        <div className={styles.priceBlocks}>
          <p>Selected Price</p>
          <div className={clsx(styles.priceBlock, styles.priceBlockTop)}>
            <p className={styles.priceBlockTitle}>Current Price</p>
            <p
              className={clsx(
                styles.priceBlockValue,
                makeRateFontSmaller && styles.priceBlockValueSmall,
              )}
            >
              {flooredRate}
            </p>
            <p className={styles.priceBlockDescription}>
              {assetAMetadata.symbol} per {assetBMetadata.symbol}
            </p>
          </div>
          <div className={styles.bottomPriceBlocks}>
            <div className={styles.priceBlock}>
              <p className={styles.priceBlockTitle}>Low price</p>
              <p className={styles.priceBlockValue}>0</p>
              <p className={styles.priceBlockDescription}>
                ${assetAMetadata.symbol} per {assetBMetadata.symbol}
              </p>
            </div>
            <div className={styles.priceBlock}>
              <p className={styles.priceBlockTitle}>High Price</p>
              <p className={styles.priceBlockValue}>∞</p>
              <p className={styles.priceBlockDescription}>
                {assetAMetadata.symbol} per {assetBMetadata.symbol}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.sticky}>
          <ActionButton onClick={handleWithdrawLiquidity} fullWidth>
            Remove Liquidity
          </ActionButton>
        </div>
      </section>
      <section className={clsx(styles.contentSection, "desktopOnly")}>
        <div className={styles.positionHeading}>
          <div className={styles.coinPairAndLabel}>
            <CoinPair
              firstCoin={pool[0].bits}
              secondCoin={pool[1].bits}
              withFeeBelow
              isStablePool={isStablePool}
            />
            <PositionLabel className={styles.smallLabel} />
          </div>
          <ActionButton
            className={styles.withdrawButton}
            onClick={handleWithdrawLiquidity}
          >
            Remove Liquidity
          </ActionButton>
        </div>
        <div className={styles.topRow}>
          <div className={styles.miraBlock}>
            <div className={styles.miraLogo}>
              <LogoIcon />
            </div>
            <p className={styles.tokenDisplayValue}>
              {lpTokenDisplayValue} LP tokens
            </p>
            <p className={styles.numberAndCopy}>
              Asset ID: {formattedLpTokenAssetId}
              <IconButton onClick={handleCopy}>
                <CopyIcon />
              </IconButton>
            </p>
          </div>
          <div className={styles.infoBlocks}>
            <div className={styles.infoBlock}>
              <p>Liquidity</p>
              {isMatching ? (
                <div className={styles.aprBadge}>
                  <p>APR &nbsp;</p>
                  <AprBadge
                    aprValue={aprValue}
                    poolKey={poolKey}
                    tvlValue={tvlValue}
                    small={true}
                  />
                </div>
              ) : (
                <p>
                  APR &nbsp;
                  <span
                    className={clsx(styles.pending, !aprValue && "blurredText")}
                  >
                    {aprValue ?? "33.33%"}
                  </span>
                </p>
              )}

              <div className={styles.coinsData}>
                <CoinWithAmount
                  assetId={pool[0].bits}
                  amount={formatDisplayAmount(coinAAmount)}
                />
                <CoinWithAmount
                  assetId={pool[1].bits}
                  amount={formatDisplayAmount(coinBAmount)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.priceBlockLargeDesktop}>
          <p>Selected Price</p>
          <div className={styles.priceBlocksDesktop}>
            <div className={styles.priceBlockDesktop}>
              <p className={styles.priceBlockTitle}>Low price</p>
              <p className={styles.priceBlockValue}>0</p>
              <p className={styles.priceBlockDescription}>
                {assetAMetadata.symbol} per {assetBMetadata.symbol}
              </p>
            </div>
            <div className={styles.priceBlockDesktop}>
              <p className={styles.priceBlockTitle}>Current Price</p>
              <p
                className={clsx(
                  styles.priceBlockValue,
                  makeRateFontSmaller && styles.priceBlockValueSmall,
                )}
              >
                {flooredRate}
              </p>
              <p className={styles.priceBlockDescription}>
                {assetAMetadata.symbol} per {assetBMetadata.symbol}
              </p>
            </div>
            <div className={styles.priceBlockDesktop}>
              <p className={styles.priceBlockTitle}>High Price</p>
              <p className={styles.priceBlockValue}>∞</p>
              <p className={styles.priceBlockDescription}>
                {assetAMetadata.symbol} per {assetBMetadata.symbol}
              </p>
            </div>
          </div>
        </div>
      </section>
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
};

export default PositionView;
