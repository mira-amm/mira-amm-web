import React from "react";
import clsx from "clsx";
import Link from "next/link";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import StarsIcon from "@/src/components/icons/Stars/StarsIcon";
import {PoolId} from "mira-dex-ts";
import styles from "./DesktopPositionView.module.css";
import AprDisplay from "../AprDisplay/AprDisplay";
import ReserveItem from "../ReserveItem/ReserveItem";
import ExchangeRate from "../ExchangeRate/ExchangeRate";
import MiraBlock from "../MiraBlock/MiraBlock";
import {formatDisplayAmount} from "@/src/utils/common";

interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
}
interface AssetData {
  amount: string;
  metadata: AssetMetadata & {isLoading: boolean};
  reserve?: number;
}

interface DesktopPositionViewProps {
  pool: PoolId;
  isStablePool: boolean;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  handleWithdrawLiquidity: () => void;
}

const DesktopPositionView = ({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  handleWithdrawLiquidity,
}: DesktopPositionViewProps): JSX.Element => {
  return (
    <section className={clsx(styles.contentSection, "desktopOnly")}>
      <div className={styles.positionHeading}>
        <div className={styles.coinPairAndLabel}>
          <CoinPair
            firstCoin={pool[0].bits}
            secondCoin={pool[1].bits}
            isStablePool={isStablePool}
            withPoolDescription
          />
        </div>
        <div className={styles.actionBtnDiv}>
          <ActionButton
            variant="secondary"
            className={styles.withdrawButton}
            onClick={handleWithdrawLiquidity}
          >
            Remove Liquidity
          </ActionButton>
          <Link href={positionPath}>
            <ActionButton variant="primary" className={styles.withdrawButton}>
              Add Liquidity
            </ActionButton>
          </Link>
        </div>
      </div>

      <div className={styles.topRow}>
        <MiraBlock pool={pool} />
        <div className={styles.infoBlocks}>
          <div className={styles.infoBlock}>
            <p className={styles.subheading}>Your position</p>
            <AprDisplay pool={pool} />
            <div className={styles.coinsData}>
              <CoinWithAmount
                assetId={pool[0].bits}
                amount={formatDisplayAmount(assetA.amount)}
              />
              <CoinWithAmount
                assetId={pool[1].bits}
                amount={formatDisplayAmount(assetB.amount)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.priceBlockLargeDesktop}>
        <p className={styles.subheading}>Pool reserves</p>
        <ReserveItem
          assetId={pool[0].bits}
          amount={assetA.amount}
          reserve={assetA.reserve}
        />
        <ReserveItem
          assetId={pool[1].bits}
          amount={assetB.amount}
          reserve={assetB.reserve}
        />
        {formattedTvlValue && <div className={clsx(styles.divider)}></div>}
        <div className={styles.footer}>
          <div className={styles.reserveItems}>
            {formattedTvlValue && <p>Total value locked</p>}
            {formattedTvlValue && <p>${formattedTvlValue}</p>}
          </div>
          <ExchangeRate
            assetBMetadata={assetB.metadata}
            assetAMetadata={assetA.metadata}
            coinAAmount={assetA.amount}
            coinBAmount={assetB.amount}
          />
        </div>
      </div>

      <PromoBlock
        icon={<StarsIcon />}
        title="Learn about providing liquidity"
        link="https://mirror.xyz/miraly.eth"
        linkText="Click here and check our v3 LP walkthrough"
      />
    </section>
  );
};

export default DesktopPositionView;
