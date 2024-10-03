import {memo, MouseEvent, useEffect, useRef} from "react";

import styles from './Info.module.css';
import InfoIcon from "@/src/components/icons/Info/InfoIcon";

type Props = {
  tooltipText: string;
}

const Info = ({ tooltipText }: Props) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const buttonId = `${tooltipText}-button`;
  const tooltipId = `${tooltipText}-tooltip`;
  //
  // useEffect(() => {
  //   const button = buttonRef.current;
  //   const tooltip = tooltipRef.current;
  //
  //   if (button && tooltip) {
  //     button.style.setProperty('anchor-name', `--${buttonId}`);
  //     tooltip.style.setProperty('position-anchor', `--${buttonId}`);
  //     tooltip.style.setProperty('top', `anchor(--${buttonId} bottom)`);
  //     tooltip.style.setProperty('left', `anchor(--${buttonId} right)`);
  //     // button.setAttribute('popover-target', tooltipId);
  //     // tooltip.setAttribute('popover', 'auto');
  //     // tooltip.setAttribute('anchor', buttonId);
  //   }
  // }, []);
  return null;

  return (
    <div className={styles.infoContainer}>
      <button id={buttonId} className={styles.infoButton} onClick={handleClick} popoverTarget={tooltipId} ref={buttonRef}>
        <InfoIcon />
      </button>
      <div className={styles.tooltip} id={tooltipId} popover="auto" ref={tooltipRef}>
        {tooltipText}
      </div>
    </div>
  );
};

export default memo(Info);
