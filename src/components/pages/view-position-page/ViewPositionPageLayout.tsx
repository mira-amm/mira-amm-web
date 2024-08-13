'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './ViewPositionPageLayout.module.css';
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import CopyIcon from "@/src/components/icons/Copy/CopyIcon";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useModal from "@/src/hooks/useModal/useModal";
import RemoveLiquidityModalContent
  from "@/src/components/pages/view-position-page/components/RemoveLiquidityModalContent";
import {isMobile} from "react-device-detect";

const ViewPositionPageLayout = () => {
  const [RemoveLiquidityModal, openRemoveLiquidityModal] = useModal();

  const handleWithdrawLiquidity = () => {
    openRemoveLiquidityModal();
  }

  return (
    <>
      <Header/>
      <main className={styles.viewPositionLayout}>
        <BackLink showOnDesktop href="/liquidity" title="Back to Pool"/>
        {isMobile ? (
          <section className={styles.contentSection}>
            <div className={styles.coinPairAndLabel}>
              <CoinPair firstCoin="USDT" secondCoin="ETH"/>
              <PositionLabel/>
            </div>
            <div className={styles.infoBlock}>
              <p>Liquidity</p>
              <p>$3.45</p>
              <div className={styles.coinsData}>
                <CoinWithAmount coin="USDT" amount="10.000"/>
                <CoinWithAmount coin="ETH" amount="10.000"/>
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.feesTitle}>
                <p>Unclaimed fees</p>
                <button className={styles.collectButton}>
                  Collect fees
                </button>
              </div>
              <p>$0,000048</p>
              <div className={styles.coinsData}>
                <CoinWithAmount coin="USDT" amount="0"/>
                <CoinWithAmount coin="ETH" amount="<0.002"/>
              </div>
            </div>
            <div className={styles.miraBlock}>
              <p className={styles.miraLogo}>Mira</p>
              <div className={styles.numberAndCopy}>
                <p>#5668403</p>
                <button className={styles.copyButton}>
                  <CopyIcon/>
                  Copy link
                </button>
              </div>
            </div>
            <div className={styles.priceBlocks}>
              <p>Selected Price</p>
              <div className={clsx(styles.priceBlock, styles.priceBlockTop)}>
                <p className={styles.priceBlockTitle}>Current Price</p>
                <p className={styles.priceBlockValue}>3,718.23</p>
                <p className={styles.priceBlockDescription}>ETH per USDT</p>
              </div>
              <div className={styles.bottomPriceBlocks}>
                <div className={styles.priceBlock}>
                  <p className={styles.priceBlockTitle}>Low price</p>
                  <p className={styles.priceBlockValue}>0</p>
                  <p className={styles.priceBlockDescription}>ETH per USDT</p>
                </div>
                <div className={styles.priceBlock}>
                  <p className={styles.priceBlockTitle}>High Price</p>
                  <p className={styles.priceBlockValue}>∞</p>
                  <p className={styles.priceBlockDescription}>ETH per USDT</p>
                </div>
              </div>
            </div>
            <ActionButton onClick={handleWithdrawLiquidity}>Withdraw Liquidity</ActionButton>
          </section>
        ) : (
          <section className={styles.contentSection}>
            <div className={styles.coinPairAndLabel}>
              <CoinPair firstCoin="USDT" secondCoin="ETH"/>
              <ActionButton className={styles.withdrawButton} onClick={handleWithdrawLiquidity}>Withdraw Liquidity</ActionButton>
            </div>
            <div className={styles.topRow}>
              <div className={styles.miraBlock}>
                <p className={styles.miraLogo}>Mira</p>
                <div className={styles.numberAndCopy}>
                  <p>#5668403</p>
                  <button className={styles.copyButton}>
                    <CopyIcon/>
                    Copy link
                  </button>
                </div>
              </div>
              <div className={styles.infoBlocks}>
                <div className={styles.infoBlock}>
                  <p>Liquidity</p>
                  <p>$3.45</p>
                  <div className={styles.coinsData}>
                    <CoinWithAmount coin="USDT" amount="10.000"/>
                    <CoinWithAmount coin="ETH" amount="10.000"/>
                  </div>
                </div>
                <div className={styles.infoBlock}>
                  <div className={styles.feesTitle}>
                    <p>Unclaimed fees</p>
                    <button className={styles.collectButton}>
                      Collect fees
                    </button>
                  </div>
                  <p>$0,000048</p>
                  <div className={styles.coinsData}>
                    <CoinWithAmount coin="USDT" amount="0"/>
                    <CoinWithAmount coin="ETH" amount="<0.002"/>
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
                  <p className={styles.priceBlockDescription}>ETH per USDT</p>
                </div>
                <div className={styles.priceBlockDesktop}>
                  <p className={styles.priceBlockTitle}>Low price</p>
                  <p className={styles.priceBlockValue}>0</p>
                  <p className={styles.priceBlockDescription}>ETH per USDT</p>
                </div>
                <div className={styles.priceBlockDesktop}>
                  <p className={styles.priceBlockTitle}>High Price</p>
                  <p className={styles.priceBlockValue}>∞</p>
                  <p className={styles.priceBlockDescription}>ETH per USDT</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer/>
      <RemoveLiquidityModal title="Remove Liquidity">
        <RemoveLiquidityModalContent/>
      </RemoveLiquidityModal>
    </>
  );
};

export default ViewPositionPageLayout;
