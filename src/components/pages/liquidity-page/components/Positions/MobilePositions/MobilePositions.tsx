import MobilePositionItem
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositionItem/MobilePositionItem";

import styles from "./MobilePositions.module.css";
import {isMobile} from "react-device-detect";

const MobilePositions = () => {
  if (!isMobile) {
    return null;
  }

  return (
    <div className={styles.mobilePositions}>
      <MobilePositionItem />
      <div className={styles.separator}/>
      <MobilePositionItem />
    </div>
  );
};

export default MobilePositions;
