import BoostsIcon from "@/src/components/icons/Boosts/BoostsIcon";
import styles from "./BoostsBanner.module.css";
import Link from "next/link";
import {BoostsLearnMoreUrl} from "@/src/utils/constants";

const BoostsBanner = (): JSX.Element => {
  return (
    <div className={styles.banner}>
      <BoostsIcon />
      <p className={styles.header}>Introducing Boosts</p>
      <div className={styles.bottomArea}>
        <p className={styles.subHeader}>
          Earn $FUEL by providing liquidity to the highlighted pools.
        </p>
        <Link href={BoostsLearnMoreUrl} target="_blank">
          <button className={styles.learnMore}>
            Learn more <span className={styles.arrow}>&rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BoostsBanner;
