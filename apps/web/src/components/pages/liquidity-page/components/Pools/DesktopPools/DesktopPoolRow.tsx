import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Link from "next/link";
import styles from "./DesktopPools.module.css";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";

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
        <div className={styles.aprTd}>
          <AprBadge
            aprValue={aprValue}
            poolKey={poolKey}
            tvlValue={tvlActual}
          />
        </div>
      ) : (
        <td className={clsx(!aprValue && styles.pending)}>{aprValue}</td>
      )}
      <td>{volumeValue}</td>
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
