import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

import styles from "./DesktopPools.module.css";
import { useRouter } from "next/navigation";
import { createPoolKey, getCoinByAssetId } from "@/src/utils/common";
import { PoolMetadata } from "mira-dex-ts";
import { clsx } from "clsx";

type Props = {
  poolsData: (PoolMetadata | null | undefined)[] | undefined;
};

const DesktopPools = ({ poolsData }: Props) => {
  const router = useRouter();

  if (!poolsData) {
    return null;
  }

  const handleAddClick = (key: string) => {
    router.push(`/liquidity/add?pool=${key}`);
  };

  return (
    <table className={clsx(styles.desktopPools, "desktopOnly")}>
      <thead>
        <tr>
          <th>Pools</th>
          <th>APR</th>
          <th>24H Volume</th>
          <th>TVL</th>
          <th>
            {" "}
            <ActionButton
              className={styles.addButton}
              onClick={() => {}}
            >
              Create a pool
            </ActionButton>
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        {poolsData.map((poolData) => {
          if (!poolData) {
            return null;
          }

          const { poolId } = poolData;

          const key = createPoolKey(poolId);

          const coinA = getCoinByAssetId(poolId[0].bits);
          const coinB = getCoinByAssetId(poolId[1].bits);

          return (
            <tr key={key}>
              <td>
                <CoinPair firstCoin={coinA} secondCoin={coinB} />
              </td>
              <td className="blurredText">68,78%</td>
              <td className="blurredText">$456,567</td>
              <td className="blurredText">$1,307,567</td>
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
