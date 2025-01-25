import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from "./MobilePositionItem.module.css";
import {formatUnits} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {Position} from "@/src/hooks/usePositions";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {buildPoolId} from "mira-dex-ts";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {DefaultLocale} from "@/src/utils/constants";
import {createPoolKey} from "@/src/utils/common";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useAssetPrice} from "@/src/hooks/useAssetPrice";
import clsx from "clsx";

type Props = {
  position: Position;
  onClick: VoidFunction;
};

const MobilePositionItem = ({position, onClick}: Props): JSX.Element => {
  const coinAMetadata = useAssetMetadata(position.token0Position[0].bits);
  const coinBMetadata = useAssetMetadata(position.token1Position[0].bits);

  const amountInUsdA = useAssetPrice(position.token0Position[0].bits)?.price;
  const amountInUsdB = useAssetPrice(position.token1Position[0].bits)?.price;

  const coinAAmount = formatUnits(
    position.token0Position[1],
    coinAMetadata.decimals,
  );
  const coinBAmount = formatUnits(
    position.token1Position[1],
    coinBMetadata.decimals,
  );

  const size =
    amountInUsdA &&
    amountInUsdB &&
    parseFloat(coinAAmount) * amountInUsdA +
      parseFloat(coinBAmount) * amountInUsdB;

  const poolId = buildPoolId(
    position.token0Position[0].bits,
    position.token1Position[0].bits,
    position.isStable,
  );
  const poolKey = createPoolKey(poolId);

  const {apr} = usePoolAPR(poolId);
  const aprValue = apr
    ? `${apr.apr.toLocaleString(DefaultLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    : null;
  const tvlValue = apr?.tvlUSD;
  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  const feeText = position.isStable ? "0.05%" : "0.3%";
  const poolTitle = position.isStable ? (
    <p className={styles.poolDescription}>{"Stable"}</p>
  ) : (
    <p className={styles.poolDescription}>{"Volatile"}</p>
  );

  return (
    <div className={styles.mobilePositionItem}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={position.token0Position[0].bits}
          secondCoin={position.token1Position[0].bits}
          isStablePool={position.isStable}
        />
      </div>
      <div className={styles.content}>
        {isMatching ? (
          <div className={styles.aprDiv}>
            <p className={styles.title}>APR</p>
            <AprBadge
              aprValue={aprValue}
              tvlValue={tvlValue}
              poolKey={poolKey}
              small={true}
            />
          </div>
        ) : (
          <div className={styles.subContent}>
            <p className={styles.title}>{"APR"}</p>
            <p className={styles.aprValue}>{aprValue}</p>
          </div>
        )}
        <p className={styles.positionPrice}>
          {size ? (
            <div className={styles.subContent}>
              <p className={styles.title}>{"Position size"}</p>
              <p className={styles.value}>${size?.toFixed(2)}</p>
            </div>
          ) : (
            <p className={styles.loadingText}>{"checking..."}</p>
          )}
        </p>
        <div className={styles.subContent}>
          {poolTitle}
          <p className={clsx(styles.poolDescription, styles.poolValue)}>
            {feeText}
          </p>
        </div>
      </div>

      <ActionButton
        onClick={onClick}
        fullWidth
        className={styles.addButton}
        variant="secondary"
      >
        Manage position
      </ActionButton>
    </div>
  );
};

export default MobilePositionItem;
