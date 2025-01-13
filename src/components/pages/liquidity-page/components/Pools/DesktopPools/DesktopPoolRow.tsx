import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Link from "next/link";
import styles from "./DesktopPools.module.css";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {pairsWithRewards} from "@/src/utils/constants";

type Props = {
  poolData: PoolData;
};

const DesktopPoolRow = ({poolData}: Props): JSX.Element => {
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  const tvlActual = parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10);

  const {symbol: firstSymbol} = useAssetMetadata(poolId[0].bits);
  const {symbol: secondSymbol} = useAssetMetadata(poolId[1].bits);

  const poolName = `${firstSymbol}/${secondSymbol}`;
  const isMatching = pairsWithRewards.some((pair) => pair === poolName);

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
        <td className={styles.aprTd}>
          <AprBadge
            aprValue={aprValue}
            small={false}
            poolKey={poolKey}
            tvlValue={tvlActual}
          />
        </td>
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
