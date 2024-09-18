import styles from "./MiraApp.module.css";
import LaunchAppButton from "../LaunchAppButton/LaunchAppButton";
import MiraLogo from "../../icons/MiraLogo/MiraLogo";

export const MiraApp = () => {
  return (
    <div className={styles.mira}>
      <div className={styles.miraLogo}><MiraLogo /></div>
      <h2 className={styles.title}>Welcome to MIRA</h2>
      <p className={styles.description}>
        Exceptional capital efficiency with robust liquidity and minimal fees
      </p>
      <LaunchAppButton className={styles.launchAppButton} />
    </div>
  );
};
