import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

import styles from "./DesktopPools.module.css";
import { useRouter } from "next/navigation";
import {createPoolIdFromIdString, createPoolKey, getAssetNamesFromPoolId} from "@/src/utils/common";
import { clsx } from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import {useCallback} from "react";
import {DefaultLocale} from "@/src/utils/constants";

type Props = {
  poolsData: PoolData[] | undefined;
};

const DesktopPools = ({ poolsData }: Props) => {
  const router = useRouter();

  const handleAddClick = useCallback((key: string) => {
    router.push(`/liquidity/add?pool=${key}`);
  }, [router]);

  if (!poolsData) {
    return null;
  }

  return (
    <table className={clsx(styles.desktopPools, "desktopOnly")}>
      <thead>
        <tr>
          <th>Pools</th>
          <th>APR</th>
          <th>24H Volume</th>
          <th>TVL</th>
          <th>
            {/*<ActionButton*/}
            {/*  className={styles.addButton}*/}
            {/*  onClick={() => {}}*/}
            {/*>*/}
            {/*  Create a pool*/}
            {/*</ActionButton>*/}
          </th>
        </tr>
      </thead>
      <tbody>
        {poolsData.map((poolData) => {
          if (!poolData) {
            return null;
          }

          const { id } = poolData;

          const poolId = createPoolIdFromIdString(id);
          const key = createPoolKey(poolId);
          const { firstAssetName, secondAssetName } = getAssetNamesFromPoolId(poolId);

          const { details: { apr, volume, tvl } } = poolData;

          const aprValue = parseFloat(apr).toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const volumeValue = parseFloat(volume).toLocaleString(DefaultLocale, { maximumFractionDigits: 0 });
          const tvlValue = parseFloat(tvl).toLocaleString(DefaultLocale, { maximumFractionDigits: 0 });

          return (
            <tr key={key}>
              <td>
                <CoinPair firstCoin={firstAssetName} secondCoin={secondAssetName} />
              </td>
              <td>{aprValue}%</td>
              <td>${volumeValue}</td>
              <td>${tvlValue}</td>
              <td>
                <ActionButton
                  className={styles.addButton}
                  onClick={() => handleAddClick(key)}
                >
                  Add Liquidity
                </ActionButton>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DesktopPools;
