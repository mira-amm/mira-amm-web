import {memo, MouseEvent, useEffect, useRef} from "react";

import styles from "./Info.module.css";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";

type Props = {
  tooltipText: string;
  tooltipKey: string;
};

const Info = ({tooltipText, tooltipKey}: Props) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

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
  }, []);

  return (
    <div className={styles.infoContainer}>
      <button
        id={buttonId}
        className={styles.infoButton}
        onClick={handleClick}
        // https://github.com/facebook/react/issues/27479#issuecomment-2131522106
        // temp fix: update to react 19 to use popover and popoverTarget
        //@ts-ignore
        popoverTarget={tooltipId}
        ref={buttonRef}
      >
        <InfoIcon />
      </button>
      <div
        className={styles.tooltip}
        id={tooltipId}
        // https://github.com/facebook/react/issues/27479#issuecomment-2131522106
        // temp fix: update to react 19 to use popover and popoverTarget
        //@ts-ignore
        popover="auto"
        ref={tooltipRef}
      >
        {tooltipText}
      </div>
    </div>
  );
};

export default memo(Info);
