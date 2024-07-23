import styles from './FaucetClaim.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import XIcon from "@/src/components/icons/X/XIcon";
import SubscribeIcon from "@/src/components/icons/Subscribe/SubscribeIcon";
import RetweetIcon from "@/src/components/icons/Retweet/RetweetIcon";
import useModal from "@/src/hooks/useModal/useModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import ClaimFailureModal from "@/src/components/common/FaucetClaim/components/ClaimFailureModal/ClaimFailureModal";
import {useCallback} from "react";
// import {getAuth, signInWithPopup, TwitterAuthProvider} from "firebase/auth";
// import {initializeApp} from "firebase/app";
// import {firebaseConfig} from "@/src/utils/initFirebase";
// import {TwitterAuthProvider} from "@firebase/auth-types";

const FaucetClaim = () => {
  const [Modal, openModal, closeModal] = useModal();

  // const handleConnectClick = () => {
  //   const provider = new TwitterAuthProvider();
  //   initializeApp(firebaseConfig);
  //   const auth = getAuth();
  //   signInWithPopup(auth, provider)
  //     .then((result) => {
  //       // This gives you a Twitter Access Token. You can use it to access the Twitter API.
  //       console.log(result);
  //     })
  // };

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
