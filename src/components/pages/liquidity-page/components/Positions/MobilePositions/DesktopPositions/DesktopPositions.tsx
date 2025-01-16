import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from "./DesktopPositions.module.css";
import {createPoolKey} from "@/src/utils/common";
import {useRouter} from "next/navigation";
import {clsx} from "clsx";
import {DesktopPosition} from "./DesktopPosition";
import {Position} from "@/src/hooks/usePositions";

type Props = {
  positions: Position[] | undefined;
};

const DesktopPositions = ({positions}: Props) => {
  const router = useRouter();

  if (!positions) {
    return null;
  }

  return (
    <table className={clsx(styles.desktopPositions, "desktopOnly")}>
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
        {positions.map((position) => (
          <DesktopPosition
            key={createPoolKey(position.poolId)}
            assetIdA={position.token0Position[0].bits}
            assetIdB={position.token1Position[0].bits}
            amountA={position.token0Position[1].toString()}
            amountB={position.token1Position[1].toString()}
            isStablePool={position.isStable}
          />
        ))}
      </tbody>
    </table>
  );
};

export default DesktopPositions;
