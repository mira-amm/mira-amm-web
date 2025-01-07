import styles from "./Boosts.module.css";
import BoostsBanner from "./BoostsBanner/BoostsBanner";

const Boosts = () => {
  return (
    <section className={styles.boosts}>
      <BoostsBanner />
    </section>
  );
};

export default Boosts;
