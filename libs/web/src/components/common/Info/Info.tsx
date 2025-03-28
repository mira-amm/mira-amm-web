import {memo, useEffect, useRef} from "react";

import styles from "./Info.module.css";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";

type Props = {
  tooltipText: string;
  tooltipKey: string;
  color?: string;
};

const Info = ({tooltipText, tooltipKey, color}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const buttonId = `${tooltipKey}-button`;
  const tooltipId = `${tooltipKey}-tooltip`;

  useEffect(() => {
    const button = buttonRef.current;
    const tooltip = tooltipRef.current;

    if (button && tooltip) {
      button.style.setProperty("anchor-name", `--${buttonId}`);
      tooltip.style.setProperty("position-anchor", `--${buttonId}`);
    }
  }, [buttonId]);

  return (
    <div
      className={styles.infoContainer}
      onMouseEnter={() => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.visibility = "visible";
      }}
      onMouseLeave={() => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.visibility = "hidden";
      }}
    >
      <button id={buttonId} className={styles.infoButton} ref={buttonRef}>
        <InfoIcon color={color} />
      </button>

      <div
        className={styles.tooltip}
        id={tooltipId}
        ref={tooltipRef}
        style={{color: color}}
      >
        {tooltipText}
      </div>
    </div>
  );
};

export default memo(Info);
