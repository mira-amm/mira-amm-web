import styles from "./InfoBlock.module.css";
import {clsx} from "clsx";
import AprBadge from "../AprBadge/AprBadge";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {PoolId} from "mira-dex-ts";
import {pairsWithRewards} from "@/src/utils/constants";

type Props = {
  title: string;
  value: string | null;
  type?: "positive" | "negative";
  poolKey?: string;
  tvlValue?: string;
  poolId: PoolId;
};

const InfoBlock = ({
  title,
  value,
  type,
  poolKey,
  tvlValue,
  poolId,
}: Props): JSX.Element => {
  const tvlActual = tvlValue
    ? parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10)
    : 0;
  const {symbol: firstSymbol} = useAssetMetadata(poolId[0].bits);

  const {symbol: secondSymbol} = useAssetMetadata(poolId[1].bits);

  const poolName = `${firstSymbol}/${secondSymbol}`;
  const isMatching = pairsWithRewards.some((pair) => pair === poolName);

  return (
    <div className={styles.infoBlock}>
      <p>{title}</p>
      {title === "APR" && isMatching ? (
        <AprBadge
          small={true}
          aprValue={value}
          poolKey={poolKey || ""}
          tvlValue={tvlActual}
        />
      ) : (
        <p
          className={clsx(
            styles.infoBlockValue,
            type === "positive" && styles.infoBlockValuePositive,
            !value && styles.pending,
          )}
        >
          {value ?? "Awaiting data"}
        </p>
      )}
    </div>
  );
};

export default InfoBlock;
