import styles from './FaucetClaim.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import XIcon from "@/src/components/icons/X/XIcon";
import SubscribeIcon from "@/src/components/icons/Subscribe/SubscribeIcon";
import RetweetIcon from "@/src/components/icons/Retweet/RetweetIcon";
import useModal from "@/src/hooks/useModal/useModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import ClaimFailureModal from "@/src/components/common/FaucetClaim/components/ClaimFailureModal/ClaimFailureModal";
import {useCallback, useState} from "react";
import useTwitterAuth from "@/src/hooks/useTwitterAuth/useTwitterAuth";
import {getAuth} from "firebase/auth";
import {openNewTab} from "@/src/utils/common";
import ClaimSuccessModal from "@/src/components/common/FaucetClaim/components/ClaimSuccessModal/ClaimSuccessModal";
import useClaimFaucet from "@/src/hooks/useClaimFaucet/useClaimFaucet";
import {useConnectUI, useIsConnected} from "@fuels/react";

const FaucetClaim = () => {
  const [FailureModal, openFailureModal] = useModal();
  const [SuccessModal, openSuccessModal] = useModal();
  const [followClicked, setFollowClicked] = useState(false);
  const [retweetClicked, setRetweetClicked] = useState(false);

  const { isConnected } = useIsConnected();
  const { connect } = useConnectUI();

  const { data, mutateAsync, reset } = useTwitterAuth();

  const handleConnectClick = async () => {
    await mutateAsync();
  };

  const handleDisconnectClick = async () => {
    const auth = getAuth();
    await auth.signOut();
    reset();
  };

  const notAllStepsCompleted = !data || !followClicked || !retweetClicked;

  const { mutateAsync: claim, isPending } = useClaimFaucet();

  const handleClaimClick = useCallback(async () => {
    if (notAllStepsCompleted) {
      openFailureModal();
      return;
    }

    if (!isConnected) {
      connect();
      return;
    }

    const claimData = await claim();
    const result = await claimData?.waitForResult();
    if (result?.transactionResult.status === 'success') {
      openSuccessModal();
    }
  }, [
    notAllStepsCompleted,
    isConnected,
    claim,
    openFailureModal,
    connect,
    openSuccessModal
  ]);

  const handleFollowClick = () => {
    openNewTab('https://x.com/MiraProtocol');
    setFollowClicked(true);
  };

  const handleRetweetClick = () => {
    openNewTab('https://twitter.com/intent/retweet?tweet_id=463440424141459456');
    setRetweetClicked(true);
  };

  return (
    <>
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <XIcon />
          </div>
          {data ? (
            <div>
              {data.user.displayName}
              &nbsp;
              <button className={styles.buttonLink} onClick={handleDisconnectClick}>
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <button className={styles.buttonLink} onClick={handleConnectClick}>
                Connect
              </button>
              &nbsp;
              Twitter
            </div>
          )}
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <SubscribeIcon/>
          </div>
          <div>
            <button className={styles.buttonLink} onClick={handleFollowClick}>
              Follow
            </button>
            &nbsp;MIRA on X
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <RetweetIcon />
          </div>
          <button className={styles.buttonLink} onClick={handleRetweetClick}>
            Retweet
          </button>
        </div>
      </div>
      <ActionButton
        className={styles.claimButton}
        loading={isPending}
        disabled={!data && !followClicked && !retweetClicked}
        onClick={handleClaimClick}
      >
        Claim $mimicMIRA
      </ActionButton>
      <FailureModal title={<TestnetLabel />}>
        <ClaimFailureModal />
      </FailureModal>
      <SuccessModal title={<TestnetLabel />}>
        <ClaimSuccessModal />
      </SuccessModal>
    </>
  );
};

export default FaucetClaim;
