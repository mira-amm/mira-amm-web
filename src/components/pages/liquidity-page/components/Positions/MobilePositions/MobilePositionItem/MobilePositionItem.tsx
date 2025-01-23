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

type Props = {
  position: Position;
  onClick: VoidFunction;
};

const MobilePositionItem = ({position, onClick}: Props): JSX.Element => {
  const coinAMetadata = useAssetMetadata(position.token0Position[0].bits);
  const coinBMetadata = useAssetMetadata(position.token1Position[0].bits);

  const coinAAmount = formatUnits(
    position.token0Position[1],
    coinAMetadata.decimals,
  );
  const coinBAmount = formatUnits(
    position.token1Position[1],
    coinBMetadata.decimals,
  );

  const totalSize = parseFloat(coinAAmount + coinBAmount).toFixed(2);

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
  const poolDescription = `${position.isStable ? "Stable" : "Volatile"}: ${feeText}`;

  return (
    <div className={styles.mobilePositionItem}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={position.token0Position[0].bits}
          secondCoin={position.token1Position[0].bits}
          isStablePool={position.isStable}
        />
        {isMatching ? (
          <AprBadge
            aprValue={aprValue}
            tvlValue={tvlValue}
            poolKey={poolKey}
            small={true}
            leftAlignValue={"-210px"}
          />
        ) : (
          <p>{`APR: ${aprValue}`}</p>
        )}
      </div>

      <p className={styles.positionPrice}>{`Size: ${totalSize} `}</p>
      <p className={styles.poolDescription}>{poolDescription}</p>
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
