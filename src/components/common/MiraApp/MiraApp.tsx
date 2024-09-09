import styles from "./MiraApp.module.css"
import Mira from "../../icons/Mira/Mira";
import LaunchAppButton from "../LaunchAppButton/LaunchAppButton";

export const MiraApp = () => {
 return <div className={styles.mira}>
    <Mira />
    <h2 className={styles.title}>Welcome to MIRA</h2>
    <p className={styles.description}>Exceptional capital efficiency with robust liquidity and minimal fees</p>
    <LaunchAppButton className={styles.launchAppButton} />
 </div>
}