import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Link from "next/link";
import styles from "./DesktopPools.module.css";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";

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
      <td className={clsx(!aprValue && styles.pending)}>{aprValue}</td>
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
