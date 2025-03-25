import React from "react";
import clsx from "clsx";
import Link from "next/link";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import PromoBlock from "@/src/components/common/PromoBlock/PromoBlock";
import {PoolId} from "mira-dex-ts";
import styles from "./DesktopPositionView.module.css";
import AprDisplay from "../AprDisplay/AprDisplay";
import ReserveItem from "../ReserveItem/ReserveItem";
import ExchangeRate from "../ExchangeRate/ExchangeRate";
import MiraBlock from "../MiraBlock/MiraBlock";
import {formatDisplayAmount} from "@/src/utils/common";
import {LIQUIDITY_PROVIDING_DOC_URL} from "@/src/utils/constants";
import Image from "next/image";
import LearnMoreIcon from "@/assets/learn-more.png";

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
  removeLiquidityPath: string;
}

const DesktopPositionView = ({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  removeLiquidityPath,
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
        <div className={styles.actionBlock}>
          <Link href={removeLiquidityPath}>
            <ActionButton variant="secondary" className={styles.actionButton}>
              Remove liquidity
            </ActionButton>
          </Link>
          <Link href={positionPath}>
            <ActionButton variant="primary" className={styles.actionButton}>
              Add liquidity
            </ActionButton>
          </Link>
        </div>
      </div>

      <div className={styles.topRow}>
        <MiraBlock pool={pool} />
        <div className={styles.infoBlocks}>
          <div className={styles.infoBlock}>
            <p className={clsx("mc-type-m", styles.positionText)}>
              Your position
            </p>
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
        <p className={clsx("mc-type-m", styles.positionText)}>Pool reserves</p>

        <hr className={styles.divider} />

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
        {formattedTvlValue && <hr className={styles.divider} />}
        <div className={styles.footer}>
          <div className={styles.reserveItems}>
            {formattedTvlValue && (
              <p className="mc-type-b">Total value locked</p>
            )}
            {formattedTvlValue && (
              <p className="mc-mono-b">${formattedTvlValue}</p>
            )}
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
        icon={
          <Image
            src={LearnMoreIcon}
            alt={"learn more"}
            width={48}
            height={48}
            priority
          />
        }
        title="Learn about providing liquidity"
        link={LIQUIDITY_PROVIDING_DOC_URL}
        linkText="Click here and check our v3 LP walktrought"
      />
    </section>
  );
};

export default DesktopPositionView;
