import {isMobile} from "react-device-detect";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from './DesktopPositions.module.css';
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import {PoolId} from "mira-dex-ts";
import {AssetId, BigNumberish, CoinQuantity} from "fuels";
import {createPoolKey, getCoinByAssetId} from "@/src/utils/common";
import {useCallback} from "react";
import {useRouter} from "next/navigation";

type Props = {
  positions: { poolId: PoolId, lpAssetId: AssetId, lpBalance: CoinQuantity | undefined }[];
}

const DesktopPositions = ({ positions }: Props) => {
  const router = useRouter();

  const openPosition = useCallback((poolId: PoolId) => {
    const poolKey = createPoolKey(poolId);
    router.push(`/liquidity/position?pool=${poolKey}`);
  }, [router]);

  if (isMobile) {
    return null;
  }

  return (
    <table className={styles.desktopPositions}>
      <thead>
      <tr>
        <th style={{ textAlign: 'left' }}>Positions</th>
        <th style={{ textAlign: 'center' }}>Selected Price</th>
        <th style={{ textAlign: 'right' }}>
          {/*<button className={styles.hideButton}>*/}
          {/*  Hide closed positions*/}
          {/*</button>*/}
        </th>
      </tr>
      </thead>
      <tbody>
      {positions.map(position => {
        const { bits: coinAAssetId } = position.poolId[0];
        const { bits: coinBAssetId } = position.poolId[1];

        const coinA = getCoinByAssetId(coinAAssetId);
        const coinB = getCoinByAssetId(coinBAssetId);

        return (
          <tr key={position.lpAssetId.bits} onClick={() => openPosition(position.poolId)}>
            <td>
              <CoinPair firstCoin={coinA} secondCoin={coinB} />
            </td>
            <td style={{textAlign: 'center'}}>
              {`0 ${coinA} <> ∞ ${coinB}`}
            </td>
            <td className={styles.labelCell}>
              <PositionLabel/>
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  )
};

export default DesktopPositions;
