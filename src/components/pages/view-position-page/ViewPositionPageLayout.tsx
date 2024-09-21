'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './ViewPositionPageLayout.module.css';
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useModal from "@/src/hooks/useModal/useModal";
import RemoveLiquidityModalContent
  from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent/RemoveLiquidityModalContent";
import usePositionData from "@/src/hooks/usePositionData";
import {createPoolId, floorToTwoSignificantDigits, getCoinsFromKey} from "@/src/utils/common";
import {useCallback, useState} from "react";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import {useRouter, useSearchParams} from "next/navigation";
import {coinsConfig} from "@/src/utils/coinsConfig";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import RemoveLiquiditySuccessModal
  from "@/src/components/pages/view-position-page/components/RemoveLiquiditySuccessModal/RemoveLiquiditySuccessModal";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CopyIcon from "@/src/components/icons/Copy/CopyIcon";
import {getLPAssetId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID, DefaultLocale} from "@/src/utils/constants";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import LogoIcon from "@/src/components/icons/Logo/LogoIcon";

const ViewPositionPageLayout = () => {
  const [RemoveLiquidityModal, openRemoveLiquidityModal, closeRemoveLiquidityModal] = useModal();
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();

  const router = useRouter();

  const query = useSearchParams();
  const poolKey = query.get('pool');
  // TODO: Validate poolkey
  const { coinA, coinB } = getCoinsFromKey(poolKey!);
  const pool = createPoolId(coinA, coinB);

  const { positionData: { assets, lpTokenBalance } } = usePositionData({ pool });

  const coinADecimals = coinsConfig.get(coinA)?.decimals!;
  const coinAAsset = assets?.[0];
  const coinAAmount = (coinAAsset?.[1].toNumber() ?? 0) / 10 ** coinADecimals;
  let coinAValue = coinAAmount
    .toLocaleString(DefaultLocale, { minimumFractionDigits: coinAAmount < 1 ? 5 : 2 });
  coinAValue = coinAValue === '0.00000' ? '<0.00001' : coinAValue;
  const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
  const coinBAsset = assets?.[1];
  const coinBAmount = (coinBAsset?.[1].toNumber() ?? 0) / 10 ** coinBDecimals;
  let coinBValue = coinBAmount
    .toLocaleString(DefaultLocale, { minimumFractionDigits: coinBAmount < 1 ? 5 : 2 });
  coinBValue = coinBValue === '0.00000' ? '<0.00001' : coinBValue;

  const [removeLiquidityValue, setRemoveLiquidityValue] = useState(50);

  const { data, removeLiquidity } = useRemoveLiquidity({ pool, liquidity: removeLiquidityValue, lpTokenBalance });

  const handleWithdrawLiquidity = useCallback(() => {
    openRemoveLiquidityModal();
  }, [openRemoveLiquidityModal]);

  const handleRemoveLiquidity = useCallback(async () => {
    const result = await removeLiquidity();
    if (result) {
      closeRemoveLiquidityModal();
      openSuccessModal();
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

  const currentCoinAAmount = coinAAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: coinADecimals });
  const currentCoinBAmount = coinBAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: coinBDecimals });
  const coinAAmountToWithdraw = (coinAAmount * removeLiquidityValue / 100).toLocaleString(DefaultLocale, { minimumFractionDigits: coinADecimals });
  const coinBAmountToWithdraw = (coinBAmount * removeLiquidityValue / 100).toLocaleString(DefaultLocale, { minimumFractionDigits: coinBDecimals });

  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits, false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
  }, [lpTokenAssetId.bits]);

  const lpTokenAmount = lpTokenBalance?.toNumber() ?? 0 / 10 ** 9;
  const lpTokenDisplayValue = lpTokenAmount < 0.01 ? '<0.01' : lpTokenAmount.toLocaleString(DefaultLocale, { minimumFractionDigits: 2 });

  return (
    <>
      <Header/>
      <main className={styles.viewPositionLayout}>
        <BackLink showOnDesktop href="/liquidity" title="Back to Pool"/>
        <section className={clsx(styles.contentSection, 'mobileOnly')}>
          <div className={styles.coinPairAndLabel}>
            <CoinPair firstCoin={coinA} secondCoin={coinB} withFeeBelow/>
            <PositionLabel/>
          </div>
          <div className={styles.infoBlock}>
            <p>Liquidity</p>
            <p className="blurredText">$3.45</p>
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
                <CopyIcon/>
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
            <ActionButton onClick={handleWithdrawLiquidity} fullWidth>Withdraw Liquidity</ActionButton>
          </div>
        </section>
        <section className={clsx(styles.contentSection, 'desktopOnly')}>
          <div className={styles.positionHeading}>
            <div className={styles.coinPairAndLabel}>
              <CoinPair firstCoin={coinA} secondCoin={coinB} withFeeBelow/>
              <PositionLabel className={styles.smallLabel} />
            </div>
            <ActionButton className={styles.withdrawButton} onClick={handleWithdrawLiquidity}>Withdraw Liquidity</ActionButton>
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
                <p className="blurredText">$3.45</p>
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
      </main>
      <Footer/>
      <RemoveLiquidityModal title="Withdraw Liquidity" titleClassName={styles.withdrawLiquidityTitle}>
        <RemoveLiquidityModalContent
          coinA={coinA}
          coinB={coinB}
          currentCoinAValue={currentCoinAAmount}
          currentCoinBValue={currentCoinBAmount}
          coinAValueToWithdraw={coinAAmountToWithdraw}
          coinBValueToWithdraw={coinBAmountToWithdraw}
          closeModal={closeRemoveLiquidityModal}
          liquidityValue={removeLiquidityValue}
          setLiquidityValue={setRemoveLiquidityValue}
          handleRemoveLiquidity={handleRemoveLiquidity}
        />
      </RemoveLiquidityModal>
      <SuccessModal title={<TestnetLabel />} onClose={redirectToLiquidity}>
        <RemoveLiquiditySuccessModal
          coinA={coinA}
          coinB={coinB}
          firstCoinAmount={coinAAmountToWithdraw}
          secondCoinAmount={coinBAmountToWithdraw}
          transactionHash={data?.id}
        />
      </SuccessModal>
    </>
  );
};

export default ViewPositionPageLayout;
