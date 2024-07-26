import {memo} from "react";

import FailureIcon from "@/src/components/icons/Failure/FailureIcon";

import styles from './ClaimFailureModal.module.css';
import CheckmarkIcon from "@/src/components/icons/Checkmark/CheckmarkIcon";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

type Props = {
  walletConnected: boolean;
  twitterConnected: boolean;
  followClicked: boolean;
  retweetClicked: boolean;
  closeModal: () => void;
};

const ClaimFailureModal = ({ walletConnected, twitterConnected, followClicked, retweetClicked, closeModal }: Props) => {
  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>You haven't met all conditions</p>
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={clsx(styles.stepIcon, walletConnected && styles.stepIconSuccess)}>
            {walletConnected ? <CheckmarkIcon/> : <CloseIcon/>}
          </div>
          <p>Connect Wallet</p>
        </div>
        <div className={styles.step}>
          <div className={clsx(styles.stepIcon, twitterConnected && styles.stepIconSuccess)}>
            {twitterConnected ? <CheckmarkIcon/> : <CloseIcon/>}
          </div>
          <p>Connect X</p>
        </div>
        <div className={styles.step}>
          <div className={clsx(styles.stepIcon, followClicked && styles.stepIconSuccess)}>
            {followClicked ? <CheckmarkIcon/> : <CloseIcon/>}
          </div>
          <p>Follow MIRA on Twitter</p>
        </div>
        <div className={styles.step}>
          <div className={clsx(styles.stepIcon, retweetClicked && styles.stepIconSuccess)}>
            {retweetClicked ? <CheckmarkIcon/> : <CloseIcon/>}
          </div>
          <p>Retweet</p>
        </div>
      </div>
      <ActionButton className={styles.closeButton} onClick={closeModal}>
        Close
      </ActionButton>
    </div>
  );
};

export default memo(ClaimFailureModal);
