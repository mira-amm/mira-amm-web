import styles from "./InfoBlock.module.css";
import {clsx} from "clsx";
import AprBadge from "../AprBadge/AprBadge";

type Props = {
  title: string;
  value: string | null;
  type?: "positive" | "negative";
  poolKey?: string;
  tvlValue?: string;
};

const InfoBlock = ({title, value, type, poolKey, tvlValue}: Props) => {
  const tvlActual = tvlValue
    ? parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10)
    : 0;
  return (
    <div className={styles.infoBlock}>
      <p>{title}</p>
      {title === "APR" ? (
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
            !value && styles.pending
          )}
        >
          {value ?? "Awaiting data"}
        </p>
      )}
    </div>
  );
};

export default InfoBlock;
