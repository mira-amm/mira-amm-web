import styles from "./InfoBlock.module.css";
import {clsx} from "clsx";
import InfoIcon from "../../icons/Info/InfoIcon";
import InfoToolTip from "@/src/components/common/ToolTips/InfoToolTip/InfoToolTip";
import {isIndexerWorking} from "@/src/utils/common";

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
          styles.flexContainer
        )}
      >
        {value}
        {value === "n/a" && !isIndexerWorking && (
          <span
            className={clsx(styles.iconContainer)}
            data-tooltip-id="apr-tooltip"
            onClick={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          >
            <InfoIcon color={"#FF6666"} width={15} height={15} />
          </span>
        )}
      </p>
      <InfoToolTip
        id="apr-tooltip"
        content="Data unavailable due to an indexer issue. Updates will be available shortly."
      />
    </div>
  );
};

export default InfoBlock;
