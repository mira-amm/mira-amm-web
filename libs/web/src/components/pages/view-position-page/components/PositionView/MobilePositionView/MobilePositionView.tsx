import React, {useState} from "react";
import clsx from "clsx";
import Link from "next/link";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import PromoBlock from "@/src/components/common/PromoBlock/PromoBlock";
import {PoolId} from "mira-dex-ts";
import styles from "./MobilePositionView.module.css";
import AprDisplay from "../AprDisplay/AprDisplay";
import ReserveItem from "../ReserveItem/ReserveItem";
import ExchangeRate from "../ExchangeRate/ExchangeRate";
import MiraBlock from "../MiraBlock/MiraBlock";
import {formatTokenAmount} from "@/src/utils/formatTokenAmount";
import Image from "next/image";
import {LIQUIDITY_PROVIDING_DOC_URL} from "@/src/utils/constants";
import LearnMoreIcon from "@/assets/learn-more.png";
import {CopyNotification} from "@/src/components/common/CopyNotification/CopyNotification";
import LoadingIndicator from "@/src/components/common/LoadingIndicator/LoadingIndicator";

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

interface MobilePositionViewProps {
  pool: PoolId;
  isStablePool: boolean;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  removeLiquidityPath: string;
}

const MobilePositionView = ({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  removeLiquidityPath,
}: MobilePositionViewProps): JSX.Element => {
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  return (
    <>
      {isAddressCopied && (
        <div className={styles.notification}>
          <CopyNotification
            onClose={() => setIsAddressCopied(false)}
            text={"Asset ID copied"}
          />
        </div>
      )}
      <section className={clsx(styles.contentSection, "mobileOnly")}>
        <div className={styles.coinPairAndLabel}>
          <CoinPair
            firstCoin={pool[0].bits}
            secondCoin={pool[1].bits}
            isStablePool={isStablePool}
            withPoolDescription
          />
        </div>

        <div className={styles.infoBlock}>
          <p className={"mc-type-m"}>Your position</p>
          <AprDisplay pool={pool} />
          <div className={styles.coinsData}>
            <CoinWithAmount
              assetId={pool[0].bits}
              amount={formatTokenAmount(assetA.amount)}
            />
            <CoinWithAmount
              assetId={pool[1].bits}
              amount={formatTokenAmount(assetB.amount)}
            />
          </div>
        </div>

        <MiraBlock pool={pool} setIsAddressCopied={setIsAddressCopied} />

        <div className={styles.priceBlocks}>
          <p className={"mc-type-m"}>Pool reserves</p>
          <ReserveItem
            reserve={assetA.reserve}
            assetId={pool[0].bits}
            amount={assetA.amount}
          />
          <ReserveItem
            reserve={assetB.reserve}
            assetId={pool[1].bits}
            amount={assetB.amount}
          />

          <div className={styles.divider}></div>
          <div className={styles.reserveItems}>
            <p className="mc-type-m">Total value locked</p>
            <p className="mc-mono-m">
              {formattedTvlValue ? (
                <p>${formattedTvlValue}</p>
              ) : (
                <LoadingIndicator fontSize="mc-mono-m" />
              )}
            </p>
          </div>
          <ExchangeRate
            assetBMetadata={assetB.metadata}
            assetAMetadata={assetA.metadata}
            coinAAmount={assetA.amount}
            coinBAmount={assetB.amount}
          />
        </div>

        <div className={styles.sticky}>
          <Link href={positionPath}>
            <ActionButton
              variant="primary"
              className={styles.withdrawButton}
              fullWidth
            >
              Add Liquidity
            </ActionButton>
          </Link>
        </div>
        <div className={styles.nonSticky}>
          <Link href={removeLiquidityPath}>
            <ActionButton
              className={styles.withdrawButton}
              variant="secondary"
              fullWidth
            >
              Remove Liquidity
            </ActionButton>
          </Link>
        </div>

        <PromoBlock
          icon={
            <Image
              src={LearnMoreIcon}
              alt={"learn more"}
              width={40}
              height={40}
              priority
              placeholder="blur"
            />
          }
          title="Learn about providing liquidity"
          link={LIQUIDITY_PROVIDING_DOC_URL}
          linkText="Click here and check our v3 LP walkthrough"
        />
      </section>
    </>
  );
};

export default MobilePositionView;
