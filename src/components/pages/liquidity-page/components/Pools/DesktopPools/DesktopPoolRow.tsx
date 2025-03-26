import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {PoolData} from "@/src/hooks/usePoolsData";
import clsx from "clsx";
import Link from "next/link";
import {usePoolDetails} from "../usePoolDetails";
import styles from "./DesktopPools.module.css";

type Props = {
  poolData: PoolData;
};

const DesktopPoolRow = ({poolData}: Props): JSX.Element => {
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  const tvlActual = parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10);

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

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
      {isMatching ? (
        <td className={styles.labelCell}>
          <div className={styles.aprBadge}>
            <AprBadge
              aprValue={aprValue}
              poolKey={poolKey}
              tvlValue={tvlActual}
            />
          </div>
        </td>
      ) : (
        <td className={clsx("mc-mono-m", !aprValue && styles.pending)}>
          {aprValue}
        </td>
      )}
      <td className={clsx(styles.labelCell, "mc-mono-m")}>{volumeValue}</td>
      <td className={clsx(styles.labelCell, "mc-mono-m")}>{tvlValue}</td>
      <td>
        <Link href={`/liquidity/add?pool=${poolKey}`}>
          <ActionButton
            className={styles.createButton}
            variant="secondary"
            size="longer"
          >
            Add liquidity
          </ActionButton>
        </Link>
      </td>
    </tr>
  );
};

export default DesktopPoolRow;
