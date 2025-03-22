import styles from "./DesktopPositions.module.css";
import {createPoolKey} from "@/src/utils/common";
import {clsx} from "clsx";
import {DesktopPosition} from "./DesktopPosition";
import {Position} from "@/src/hooks/usePositions";

type Props = {
  positions: Position[] | undefined;
};

const DesktopPositions = ({positions}: Props): JSX.Element => {
  if (!positions) {
    return <></>;
  }

  return (
    <table className={clsx(styles.desktopPositions, "desktopOnly")}>
      <thead>
        <tr>
          <th>Pools</th>
          <th>APR</th>
          <th>Position size</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {positions.map((position) => (
          <DesktopPosition
            key={createPoolKey(position.poolId)}
            assetIdA={position.token0Item.token0Position[0].bits}
            assetIdB={position.token1Item.token1Position[0].bits}
            amountA={position.token0Item.token0Position[1].toString()}
            amountB={position.token1Item.token1Position[1].toString()}
            isStablePool={position.isStable}
            priceA={position.token0Item.price}
            priceB={position.token1Item.price}
          />
        ))}
      </tbody>
    </table>
  );
};

export default DesktopPositions;
