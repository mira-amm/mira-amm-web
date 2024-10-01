import {memo, MouseEvent} from "react";

import styles from './Info.module.css';
import InfoIcon from "@/src/components/icons/Info/InfoIcon";

type Props = {
  tooltipText: string;
}

const Info = ({ tooltipText }: Props) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.infoContainer}>
      <button className={styles.infoButton} onClick={handleClick} popoverTarget={tooltipText}>
        <InfoIcon />
      </button>
      <div className={styles.tooltip} id={tooltipText} popover="">
        {tooltipText}
      </div>
    </div>
  );
};

export default memo(Info);
