import {isMobile} from "react-device-detect";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

import styles from './DesktopPools.module.css';
import {useRouter} from "next/navigation";
import {createPoolKey, getCoinByAssetId} from "@/src/utils/common";
import {PoolMetadata} from "mira-dex-ts";

type Props = {
  poolsData: (PoolMetadata | null | undefined)[] | undefined;
}

const DesktopPools = ({ poolsData }: Props) => {
  const router = useRouter();

  if (isMobile) {
    return null;
  }

  if (!poolsData) {
    return null;
  }

  const handleAddClick = (key: string) => {
    router.push(`/liquidity/add?pool=${key}`);
  };

  return (
    <table className={styles.desktopPools}>
      <thead>
      <tr>
        <td>Pools</td>
        <td>APR</td>
        <td>24H Volume</td>
        <td>TVL</td>
        <td/>
      </tr>
      </thead>
      <tbody>
      {poolsData.map(poolData => {
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
            <td className="blurredText">
              68,78%
            </td>
            <td className="blurredText">
              $456,567
            </td>
            <td className="blurredText">
              $1,307,567
            </td>
            <td>
              <ActionButton className={styles.addButton} onClick={() => handleAddClick(key)}>
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
