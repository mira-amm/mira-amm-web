import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Link from "next/link";
import styles from "./DesktopPools.module.css";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {Button} from "@/meshwave-ui/Button";

const DesktopPoolRow = ({poolData}: {poolData: PoolData}) => {
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  const tvlActual = parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10);
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

      <td
        className={clsx(
          styles.aprTd,
          !isMatching && !aprValue && styles.pending,
        )}
      >
        {isMatching ? (
          <AprBadge
            aprValue={aprValue}
            poolKey={poolKey}
            tvlValue={tvlActual}
          />
        ) : (
          aprValue
        )}
      </td>

      <td>{volumeValue}</td>
      <td>{tvlValue}</td>

      <td>
        <Link href={`/liquidity/add?pool=${poolKey}`}>
          <Button variant="secondary">Add Liquidity</Button>
        </Link>
      </td>
    </tr>
  );
};

export default DesktopPoolRow;
