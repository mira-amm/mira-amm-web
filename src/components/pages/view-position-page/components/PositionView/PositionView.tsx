'use client';

import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './PositionView.module.css';
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useModal from "@/src/hooks/useModal/useModal";
import RemoveLiquidityModalContent
  from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import usePositionData from "@/src/hooks/usePositionData";
import {
  floorToTwoSignificantDigits,
  getAssetNamesFromPoolId,
} from "@/src/utils/common";
import {useCallback, useRef, useState} from "react";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import {useRouter} from "next/navigation";
import {coinsConfig} from "@/src/utils/coinsConfig";
import RemoveLiquiditySuccessModal
  from "@/src/components/pages/view-position-page/components/RemoveLiquiditySuccessModal/RemoveLiquiditySuccessModal";
import IconButton from "@/src/components/common/IconButton/IconButton";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID, DefaultLocale} from "@/src/utils/constants";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import LogoIcon from "@/src/components/icons/Logo/LogoIcon";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import { CopyIcon } from "@/src/components/icons/Copy/CopyIcon";

type Props = {
  pool: PoolId;
}

const PositionView = ({ pool }: Props) => {
  const [RemoveLiquidityModal, openRemoveLiquidityModal, closeRemoveLiquidityModal] = useModal();
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const router = useRouter();

  const { firstAssetName: coinA, secondAssetName: coinB } = getAssetNamesFromPoolId(pool);
  const isStablePool = pool[2];

  const { positionData: { assets, lpTokenBalance } } = usePositionData({ pool });
  const { apr } = usePoolAPR(pool);
  const aprValue = apr ?
    `${parseFloat(apr).toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    : null;

  const [removeLiquidityValue, setRemoveLiquidityValue] = useState(50);

  const coinADecimals = coinsConfig.get(coinA)?.decimals!;
  const coinAAsset = assets?.[0];
  const coinAAmount = (coinAAsset?.[1].toNumber() ?? 0) / 10 ** coinADecimals;
  const currentCoinAAmount = coinAAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: coinADecimals });
  let coinAValue = coinAAmount
    .toLocaleString(DefaultLocale, { minimumFractionDigits: coinAAmount < 1 ? 5 : 2 });
  coinAValue = coinAValue === '0.00000' ? '<0.00001' : coinAValue;
  const coinAAmountToWithdraw = coinAAmount * removeLiquidityValue / 100;
  const coinAAmountToWithdrawStr = coinAAmountToWithdraw.toLocaleString(DefaultLocale, { minimumFractionDigits: coinADecimals });

  const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
  const coinBAsset = assets?.[1];
  const coinBAmount = (coinBAsset?.[1].toNumber() ?? 0) / 10 ** coinBDecimals;
  const currentCoinBAmount = coinBAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: coinBDecimals });
  let coinBValue = coinBAmount
    .toLocaleString(DefaultLocale, { minimumFractionDigits: coinBAmount < 1 ? 5 : 2 });
  coinBValue = coinBValue === '0.00000' ? '<0.00001' : coinBValue;
  const coinBAmountToWithdraw = coinBAmount * removeLiquidityValue / 100;
  const coinBAmountToWithdrawStr = coinBAmountToWithdraw.toLocaleString(DefaultLocale, { minimumFractionDigits: coinBDecimals });

  const confirmationModalAssetsAmounts = useRef({ firstAsset: coinAAmountToWithdrawStr, secondAsset: coinBAmountToWithdrawStr });

  const { data, removeLiquidity, error } = useRemoveLiquidity({ pool, liquidity: removeLiquidityValue, lpTokenBalance, coinAAmountToWithdraw, coinBAmountToWithdraw, coinADecimals, coinBDecimals });

  const handleWithdrawLiquidity = useCallback(() => {
    openRemoveLiquidityModal();
  }, [openRemoveLiquidityModal]);

  const handleRemoveLiquidity = useCallback(async () => {
    try {
      const result = await removeLiquidity();
      if (result) {
        confirmationModalAssetsAmounts.current = { firstAsset: coinAAmountToWithdrawStr, secondAsset: coinBAmountToWithdrawStr };
        closeRemoveLiquidityModal();
        openSuccessModal();
      }
    } catch (e) {
      console.error(e);
      openFailureModal();
    }
  }, [removeLiquidity, closeRemoveLiquidityModal, openSuccessModal]);

  const redirectToLiquidity = useCallback(() => {
    router.push('/liquidity');
  }, [router]);

  const rate = coinAAmount / coinBAmount;
  const flooredRate = rate < 0.01
    ? floorToTwoSignificantDigits(rate).toLocaleString()
    : rate.toLocaleString(DefaultLocale, { minimumFractionDigits: 2 });
  const makeRateFontSmaller = flooredRate.length > 10;

  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const isValidNetwork = useCheckActiveNetwork();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
  }, [lpTokenAssetId.bits]);

  const lpTokenAmount = (lpTokenBalance?.toNumber() ?? 0) / 10 ** 9;
  const lpTokenDisplayValue = lpTokenAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: 2 });

  return (
    <>
      <BackLink showOnDesktop href="/liquidity" title="Back to Pool"/>
      <section className={clsx(styles.contentSection, 'mobileOnly')}>
        <div className={styles.coinPairAndLabel}>
          <CoinPair firstCoin={coinA} secondCoin={coinB} withFeeBelow isStablePool={isStablePool}/>
          <PositionLabel/>
        </div>
        <div className={styles.infoBlock}>
          <p>Liquidity</p>
          <p>
            APR
            &nbsp;
            <span className={clsx(styles.pending, !aprValue && 'blurredText')}>
              {aprValue ?? '33.33%'}
            </span>
          </p>
          <div className={styles.coinsData}>
            <CoinWithAmount coin={coinA} amount={coinAValue}/>
            <CoinWithAmount coin={coinB} amount={coinBValue}/>
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
            <p className={clsx(styles.priceBlockValue, makeRateFontSmaller && styles.priceBlockValueSmall)}>
              {flooredRate}
            </p>
            <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
          </div>
          <div className={styles.bottomPriceBlocks}>
            <div className={styles.priceBlock}>
              <p className={styles.priceBlockTitle}>Low price</p>
              <p className={styles.priceBlockValue}>0</p>
              <p className={styles.priceBlockDescription}>${coinA} per {coinB}</p>
            </div>
            <div className={styles.priceBlock}>
              <p className={styles.priceBlockTitle}>High Price</p>
              <p className={styles.priceBlockValue}>∞</p>
              <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
            </div>
          </div>
        </div>
        <div className={styles.sticky}>
          <ActionButton onClick={handleWithdrawLiquidity} fullWidth>Remove Liquidity</ActionButton>
        </div>
      </section>
      <section className={clsx(styles.contentSection, 'desktopOnly')}>
        <div className={styles.positionHeading}>
          <div className={styles.coinPairAndLabel}>
            <CoinPair firstCoin={coinA} secondCoin={coinB} withFeeBelow isStablePool={isStablePool}/>
            <PositionLabel className={styles.smallLabel} />
          </div>
          <ActionButton className={styles.withdrawButton} onClick={handleWithdrawLiquidity}>Remove Liquidity</ActionButton>
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
              <p>
                APR
                &nbsp;
                <span className={clsx(styles.pending, !aprValue && 'blurredText')}>
                  {aprValue ?? '33.33%'}
                </span>
              </p>
              <div className={styles.coinsData}>
                <CoinWithAmount coin={coinA} amount={coinAValue}/>
                <CoinWithAmount coin={coinB} amount={coinBValue}/>
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
              <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
            </div>
            <div className={styles.priceBlockDesktop}>
              <p className={styles.priceBlockTitle}>Current Price</p>
              <p className={clsx(styles.priceBlockValue, makeRateFontSmaller && styles.priceBlockValueSmall)}>
                {flooredRate}
              </p>
              <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
            </div>
            <div className={styles.priceBlockDesktop}>
              <p className={styles.priceBlockTitle}>High Price</p>
              <p className={styles.priceBlockValue}>∞</p>
              <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
            </div>
          </div>
        </div>
      </section>
      <RemoveLiquidityModal title="Remove Liquidity" titleClassName={styles.withdrawLiquidityTitle}>
        <RemoveLiquidityModalContent
          coinA={coinA}
          coinB={coinB}
          isStablePool={isStablePool}
          currentCoinAValue={currentCoinAAmount}
          currentCoinBValue={currentCoinBAmount}
          coinAValueToWithdraw={coinAAmountToWithdrawStr}
          coinBValueToWithdraw={coinBAmountToWithdrawStr}
          closeModal={closeRemoveLiquidityModal}
          liquidityValue={removeLiquidityValue}
          setLiquidityValue={setRemoveLiquidityValue}
          handleRemoveLiquidity={handleRemoveLiquidity}
          isValidNetwork={isValidNetwork}
        />
      </RemoveLiquidityModal>
      <SuccessModal title={<></>} onClose={redirectToLiquidity}>
        <RemoveLiquiditySuccessModal
          coinA={coinA}
          coinB={coinB}
          firstCoinAmount={confirmationModalAssetsAmounts.current.firstAsset}
          secondCoinAmount={confirmationModalAssetsAmounts.current.secondAsset}
          transactionHash={data?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>}>
        <TransactionFailureModal closeModal={closeFailureModal} />
      </FailureModal>
    </>
  );
};

export default PositionView;
