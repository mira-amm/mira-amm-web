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
import clsx from "clsx";

type Props = {
  position: Position;
  onClick: VoidFunction;
};

const MobilePositionItem = ({position, onClick}: Props): JSX.Element => {
  const coinAMetadata = useAssetMetadata(
    position.token0Item.token0Position[0].bits,
  );
  const coinBMetadata = useAssetMetadata(
    position.token1Item.token1Position[0].bits,
  );

  const amountInUsdA = position.token0Item.price;
  const amountInUsdB = position.token1Item.price;

  const coinAAmount = formatUnits(
    position.token0Item.token0Position[1],
    coinAMetadata.decimals,
  );
  const coinBAmount = formatUnits(
    position.token1Item.token1Position[1],
    coinBMetadata.decimals,
  );

  const size =
    parseFloat(coinAAmount) * amountInUsdA +
    parseFloat(coinBAmount) * amountInUsdB;

  const poolId = buildPoolId(
    position.token0Item.token0Position[0].bits,
    position.token1Item.token1Position[0].bits,
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
  const poolTitle = position.isStable ? "Stable" : "Volatile";
  return (
    <div className={styles.mobilePositionItem}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={position.token0Item.token0Position[0].bits}
          secondCoin={position.token1Item.token1Position[0].bits}
          isStablePool={position.isStable}
        />
      </div>
      <div className={styles.content}>
        {isMatching ? (
          <div>
            <p className={clsx(styles.title, "mc-type-m")}>APR</p>
            <AprBadge
              aprValue={aprValue}
              tvlValue={tvlValue}
              poolKey={poolKey}
              small
            />
          </div>
        ) : (
          <div className={clsx(styles.subContent, styles.aprDiv)}>
            <p className={clsx(styles.title, "mc-type-m")}>{"APR"}</p>
            <p className={clsx(styles.aprValue, "mc-mono-m")}>{aprValue}</p>
          </div>
        )}
        <div className={styles.positionPrice}>
          {size ? (
            <div className={styles.subContent}>
              <p className={clsx(styles.title, "mc-type-m")}>
                {"Position size"}
              </p>
              <p className={clsx(styles.value, "mc-mono-m")}>
                ${size?.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className={clsx(styles.loadingText, "mc-type-m")}>
              {"checking..."}
            </p>
          )}
        </div>
        <div className={styles.subContent}>
          <p className={clsx(styles.poolDescription, "mc-type-m")}>
            {poolTitle}
          </p>
          <p className={clsx(styles.poolDescription, "mc-mono-m")}>{feeText}</p>
        </div>
      </div>

      <ActionButton onClick={onClick} variant="secondary" fullWidth>
        Manage Position
      </ActionButton>
    </div>
  );
};

export default MobilePositionItem;
