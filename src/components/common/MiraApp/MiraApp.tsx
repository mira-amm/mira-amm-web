import styles from "./MiraApp.module.css";
import LaunchAppButton from "../LaunchAppButton/LaunchAppButton";
// import MiraLogo from "../../icons/MiraLogo/MiraLogo";
import miraLogo from "../../icons/26.png";
import Image from "next/image";

export const MiraApp = () => {
  return (
    <div className={styles.mira}>
      <img className={styles.logo} src={miraLogo.src} alt="Mira Logo"/>
      <h2 className={styles.title}>Welcome to MIRA</h2>
      <p className={styles.description}>
        Exceptional capital efficiency with robust liquidity and minimal fees
      </p>
      <LaunchAppButton className={styles.launchAppButton} />
    </div>
  );
};
