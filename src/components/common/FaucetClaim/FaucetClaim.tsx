import styles from './FaucetClaim.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import XIcon from "@/src/components/icons/X/XIcon";
import SubscribeIcon from "@/src/components/icons/Subscribe/SubscribeIcon";
import RetweetIcon from "@/src/components/icons/Retweet/RetweetIcon";
import useModal from "@/src/hooks/useModal/useModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import ClaimFailureModal from "@/src/components/common/FaucetClaim/components/ClaimFailureModal/ClaimFailureModal";
import {useCallback} from "react";

const FaucetClaim = () => {
  const [Modal, openModal, closeModal] = useModal();

  const handleClaimClick = useCallback(() => {
    openModal();
  }, []);

  return (
    <>
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <XIcon />
          </div>
          <div>
            <button className={styles.buttonLink}>
              Connect
            </button>
            {' '}
            Twitter
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <SubscribeIcon/>
          </div>
          <div>
            <button className={styles.buttonLink}>
              Follow
            </button>
            {' '}
            MIRA on X
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <RetweetIcon />
          </div>
          <button className={styles.buttonLink}>
            Retweet
          </button>
        </div>
      </div>
      <ActionButton className={styles.claimButton} onClick={handleClaimClick}>
      Claim $mimicMIRA
      </ActionButton>
      <Modal title={<TestnetLabel />}>
        <ClaimFailureModal />
      </Modal>
    </>
  );
};

export default FaucetClaim;
