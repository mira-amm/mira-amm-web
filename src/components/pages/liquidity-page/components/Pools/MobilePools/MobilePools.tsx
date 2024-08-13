import {isMobile} from "react-device-detect";

import MobilePoolItem
  from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from './MobilePools.module.css';

const MobilePools = () => {
  if (!isMobile) {
    return null;
  }

  return (
    <div className={styles.mobilePools}>
      <MobilePoolItem/>
      <div className={styles.separator}/>
      <MobilePoolItem/>
      <div className={styles.separator}/>
      <MobilePoolItem/>
    </div>
  );
};

export default MobilePools;
