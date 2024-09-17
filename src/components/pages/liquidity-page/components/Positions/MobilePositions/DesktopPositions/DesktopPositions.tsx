import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from './DesktopPositions.module.css';
import {PoolId} from "mira-dex-ts";
import {createPoolKey, getCoinByAssetId} from "@/src/utils/common";
import {useCallback} from "react";
import {useRouter} from "next/navigation";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {clsx} from "clsx";

type Props = {
  positions: any[] | undefined;
}

const DesktopPositions = ({ positions }: Props) => {
  const router = useRouter();

  const openPosition = useCallback((poolId: PoolId) => {
    const poolKey = createPoolKey(poolId);
    router.push(`/liquidity/position?pool=${poolKey}`);
  }, [router]);

  if (!positions) {
    return null;
  }

  return (
    <table className={clsx(styles.desktopPositions, 'desktopOnly')}>
      <thead>
      <tr>
        <th>Positions</th>
        <th>Size</th>
        <th>
          {/*<button className={styles.hideButton}>*/}
          {/*  Hide closed positions*/}
          {/*</button>*/}
        </th>
      </tr>
      </thead>
      <tbody>
      {positions.map(position => {
        const { bits: coinAAssetId } = position[0][0];
        const coinA = getCoinByAssetId(coinAAssetId);
        const coinADecimals = coinsConfig.get(coinA)?.decimals!;
        const coinAAmount = (position[0][1].toNumber() / 10 ** coinADecimals).toFixed(coinADecimals);
        const { bits: coinBAssetId } = position[1][0];
        const coinB = getCoinByAssetId(coinBAssetId);
        const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
        const coinBAmount = (position[1][1].toNumber() / 10 ** coinBDecimals).toFixed(coinBDecimals);

        const key = coinAAssetId.toString() + '-' + coinBAssetId.toString();
        const poolId = [position[0][0], position[1][0], false] as PoolId;

        return (
          <tr className={styles.positionRow} key={key} onClick={() => openPosition(poolId)}>
            <td>
              <CoinPair firstCoin={coinA} secondCoin={coinB} withFee/>
            </td>
            <td>
              {`${coinAAmount} ${coinA} <> ${coinBAmount} ${coinB}`}
            </td>
            <td className={styles.labelCell}>
              Active
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  )
};

export default DesktopPositions;
