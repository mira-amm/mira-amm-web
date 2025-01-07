import BoostsIcon from "@/src/components/icons/Boosts/BoostsIcon";
import styles from "./Boosts.module.css";

const Boosts = () => {
  return (
    <section className={styles.boosts}>
      <div className={styles.banner}>
        <BoostsIcon />
        <p className={styles.header}>Introducing Boosts</p>
        <div className={styles.bottomArea}>
          <p className={styles.subHeader}>
            Earn $FUEL by providing liquidity on selected pools. Look for the
            boost on the pools.
          </p>
          <button className={styles.learnMore}>
            Learn more <span className={styles.arrow}>&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Boosts;
