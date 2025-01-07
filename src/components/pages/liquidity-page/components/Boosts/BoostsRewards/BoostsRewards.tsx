import styles from "./BoostsRewards.module.css";
import Link from "next/link";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

const BoostsRewards = () => {
  return (
    <div className={styles.boostsHeader}>
      <p className={styles.boostsTitle}>Boost rewards</p>
      <Link href={`/swap`}>
        <ActionButton
          className={styles.learnMoreButton}
          variant="secondary"
          fullWidth
        >
          Learn more
        </ActionButton>
      </Link>
    </div>
  );
};

export default BoostsRewards;
