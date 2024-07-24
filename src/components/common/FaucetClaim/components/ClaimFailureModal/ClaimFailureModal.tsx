import FailureIcon from "@/src/components/icons/Failure/FailureIcon";

import styles from './ClaimFailureModal.module.css';

const ClaimFailureModal = () => {
  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>You haven't met all conditions</p>
      <p className={styles.subText}>Please try again</p>
    </div>
  );
};

export default ClaimFailureModal;
