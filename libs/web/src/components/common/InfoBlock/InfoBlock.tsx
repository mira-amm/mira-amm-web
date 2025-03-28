import styles from "./InfoBlock.module.css";
import {clsx} from "clsx";

type Props = {
  title: string;
  value: string | null;
  type?: "positive" | "negative";
};

const InfoBlock = ({title, value, type}: Props) => {
  return (
    <div className={styles.infoBlock}>
      <p>{title}</p>
      <p
        className={clsx(
          styles.infoBlockValue,
          type === "positive" && styles.infoBlockValuePositive,
          !value && styles.pending,
        )}
      >
        {value ?? "Awaiting data"}
      </p>
    </div>
  );
};

export default InfoBlock;
