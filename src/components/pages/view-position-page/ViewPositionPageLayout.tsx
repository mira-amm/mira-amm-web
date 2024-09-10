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
import {isMobile} from "react-device-detect";
import usePositionData from "@/src/hooks/usePositionData";
import {createPoolId, getCoinsFromKey} from "@/src/utils/common";
import {useCallback, useState} from "react";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import {useSearchParams} from "next/navigation";
import {coinsConfig} from "@/src/utils/coinsConfig";

const ViewPositionPageLayout = () => {
  const [RemoveLiquidityModal, openRemoveLiquidityModal, closeRemoveLiquidityModal] = useModal();

  const query = useSearchParams();
  const poolKey = query.get('pool');
  // TODO: Validate poolkey
  const { coinA, coinB } = getCoinsFromKey(poolKey!);
  const pool = createPoolId(coinA, coinB);

  const { positionData: { assets, lpTokenBalance } } = usePositionData({ pool });

  const coinADecimals = coinsConfig.get(coinA)?.decimals!;
  const coinAAsset = assets?.[0];
  const coinAAmount = coinAAsset?.[1].toNumber();
  const coinAValue = (coinAAmount ? coinAAmount / 10 ** coinADecimals : 0).toFixed(2);
  const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
  const coinBAsset = assets?.[1];
  const coinBAmount = coinBAsset?.[1].toNumber();
  const coinBValue = (coinBAmount ? coinBAmount / 10 ** coinBDecimals : 0).toFixed(2);

  const [removeLiquidityValue, setRemoveLiquidityValue] = useState(50);

  const { removeLiquidity } = useRemoveLiquidity({ pool, liquidity: removeLiquidityValue, lpTokenBalance });

  const handleWithdrawLiquidity = useCallback(() => {
    openRemoveLiquidityModal();
  }, [openRemoveLiquidityModal]);

  const handleRemoveLiquidity = useCallback(async () => {
    const result = await removeLiquidity();
    if (result) {
      closeRemoveLiquidityModal();
    }
  }, [removeLiquidity, closeRemoveLiquidityModal]);

  return (
    <>
      <Header/>
      <main className={styles.viewPositionLayout}>
        <BackLink showOnDesktop href="/liquidity" title="Back to Pool"/>
        {isMobile ? (
          <section className={styles.contentSection}>
            <div className={styles.coinPairAndLabel}>
              <CoinPair firstCoin={coinA} secondCoin={coinB} />
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
            <div className={styles.infoBlock}>
              <div className={styles.feesTitle}>
                <p>Earned fees</p>
                {/*<button className={styles.collectButton} onClick={openWithdrawFeesModal}>*/}
                {/*  Collect fees*/}
                {/*</button>*/}
              </div>
              <p className="blurredText">$0,000048</p>
              <div className={styles.coinsData}>
                <CoinWithAmount coin={coinA} amount="0"/>
                <CoinWithAmount coin={coinB} amount="<0.002"/>
              </div>
            </div>
            <div className={styles.miraBlock}>
              <p className={styles.miraLogo}>Mira</p>
              <div className={styles.numberAndCopy}>
                <p>#5668403</p>
                {/*<button className={styles.copyButton}>*/}
                {/*  <CopyIcon/>*/}
                {/*  Copy link*/}
                {/*</button>*/}
              </div>
            </div>
            <div className={styles.priceBlocks}>
              <p>Selected Price</p>
              <div className={clsx(styles.priceBlock, styles.priceBlockTop)}>
                <p className={styles.priceBlockTitle}>Current Price</p>
                <p className={styles.priceBlockValue}>3,718.23</p>
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
        ) : (
          <section className={styles.contentSection}>
            <div className={styles.positionHeading}>
              <div className={styles.coinPairAndLabel}>
                <CoinPair firstCoin={coinA} secondCoin={coinB}/>
                <PositionLabel className={styles.smallLabel} />
              </div>
              <ActionButton className={styles.withdrawButton} onClick={handleWithdrawLiquidity}>Withdraw Liquidity</ActionButton>
            </div>
            <div className={styles.topRow}>
              <div className={styles.miraBlock}>
                <p className={styles.miraLogo}>Mira</p>
                <div className={styles.numberAndCopy}>
                  <p>#5668403</p>
                  {/*<button className={styles.copyButton}>*/}
                  {/*  <CopyIcon/>*/}
                  {/*  Copy link*/}
                  {/*</button>*/}
                </div>
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
                <div className={styles.infoBlock}>
                  <div className={styles.feesTitle}>
                    <p>Earned fees</p>
                    {/*<button className={styles.collectButton} onClick={openWithdrawFeesModal}>*/}
                    {/*  Collect fees*/}
                    {/*</button>*/}
                  </div>
                  <p className="blurredText">$0,000048</p>
                  <div className={styles.coinsData}>
                    <CoinWithAmount coin={coinA} amount="0"/>
                    <CoinWithAmount coin={coinB} amount="<0.002"/>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.priceBlockLargeDesktop}>
              <p>Selected Price</p>
              <div className={styles.priceBlocksDesktop}>
                <div className={styles.priceBlockDesktop}>
                  <p className={styles.priceBlockTitle}>Current Price</p>
                  <p className={styles.priceBlockValue}>3,718.23</p>
                  <p className={styles.priceBlockDescription}>{coinA} per {coinB}</p>
                </div>
                <div className={styles.priceBlockDesktop}>
                  <p className={styles.priceBlockTitle}>Low price</p>
                  <p className={styles.priceBlockValue}>0</p>
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
        )}
      </main>
      <Footer/>
      <RemoveLiquidityModal title="Remove Liquidity">
        <RemoveLiquidityModalContent
          coinA={coinA}
          coinB={coinB}
          closeModal={closeRemoveLiquidityModal}
          liquidityValue={removeLiquidityValue}
          setLiquidityValue={setRemoveLiquidityValue}
          handleRemoveLiquidity={handleRemoveLiquidity}
        />
      </RemoveLiquidityModal>
    </>
  );
};

export default ViewPositionPageLayout;
