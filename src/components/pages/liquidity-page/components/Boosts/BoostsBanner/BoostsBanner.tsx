import BoostsIcon from "@/src/components/icons/Boosts/BoostsIcon";
import styles from "./BoostsBanner.module.css";
import Link from "next/link";
import {LearnMoreUrl} from "@/src/utils/constants";

const BoostsBanner = () => {
  return (
    <div className={styles.banner}>
      <BoostsIcon />
      <p className={styles.header}>Introducing Boosts</p>
      <div className={styles.bottomArea}>
        <p className={styles.subHeader}>
          Earn $FUEL by providing liquidity on selected pools. Look for the
          boost on the pools.
        </p>
        <Link href={LearnMoreUrl} target="_blank">
          <button className={styles.learnMore}>
            Learn more <span className={styles.arrow}>&rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BoostsBanner;
