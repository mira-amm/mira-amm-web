import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from './DesktopPositions.module.css';
import {PoolId} from "mira-dex-ts";
import {createPoolKey, getAssetNameByAssetId} from "@/src/utils/common";
import {useCallback} from "react";
import {useRouter} from "next/navigation";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {clsx} from "clsx";
import {DefaultLocale} from "@/src/utils/constants";
import { formatUnits } from "fuels";
import { DesktopPosition } from "./DesktopPosition";

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
      {positions.map(position => (
        <DesktopPosition
          key={position[0][0].bits + position[1][0].bits + position.isStablePool}
          assetIdA={position[0][0].bits}
          assetIdB={position[1][0].bits}
          amountA={position[0][1]}
          amountB={position[1][1]}
          isStablePool={position.isStablePool}      
        />
      ))}
      </tbody>
    </table>
  )
};

export default DesktopPositions;
