import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Link from "next/link";
import styles from "./DesktopPools.module.css";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";
import InfoToolTip from "@/src/components/common/ToolTips/InfoToolTip/InfoToolTip";
import {isIndexerWorking} from "@/src/utils/common";

type Props = {
  poolData: PoolData;
};

const DesktopPoolRow = ({poolData}: Props) => {
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  return (
    <tr key={poolKey}>
      <td>
        <CoinPair
          firstCoin={poolId[0].bits}
          secondCoin={poolId[1].bits}
          isStablePool={isStablePool}
          withPoolDescription
        />
      </td>
      <td className={clsx(!aprValue && styles.pending)}>
        <div className={clsx(styles.flexContainer)}>
          <span>{aprValue}</span>
          {aprValue === "n/a" && !isIndexerWorking && (
            <span
              className={clsx(styles.iconContainer)}
              data-tooltip-id="apr-tooltip"
            >
              <InfoIcon color={"#FF6666"} width={15} height={15} />
            </span>
          )}
        </div>
        <InfoToolTip
          id="apr-tooltip"
          content="APR unavailable due to an indexer issue. Updates will be available shortly."
        />
      </td>

      <td>
        <div className={clsx(styles.flexContainer)}>
          <span>{volumeValue}</span>
          {volumeValue === "n/a" && !isIndexerWorking && (
            <span
              className={clsx(styles.iconContainer)}
              data-tooltip-id="volume-tooltip"
            >
              <InfoIcon color={"#FF6666"} width={15} height={15} />
            </span>
          )}
        </div>
        <InfoToolTip
          id="volume-tooltip"
          content={
            "Volume data unavailable due to an indexer issue. Updates will be available shortly."
          }
        />
      </td>

      <td>{tvlValue}</td>
      <td>
        <Link href={`/liquidity/add?pool=${poolKey}`}>
          <ActionButton
            className={styles.addButton}
            variant="secondary"
            fullWidth
          >
            Add Liquidity
          </ActionButton>
        </Link>
      </td>
    </tr>
  );
};

export default DesktopPoolRow;
