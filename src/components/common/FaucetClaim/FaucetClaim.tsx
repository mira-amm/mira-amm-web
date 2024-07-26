import styles from './FaucetClaim.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useModal from "@/src/hooks/useModal/useModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import ClaimFailureModal from "@/src/components/common/FaucetClaim/components/ClaimFailureModal/ClaimFailureModal";
import {useCallback, useEffect, useState} from "react";
import useTwitterAuth from "@/src/hooks/useTwitterAuth/useTwitterAuth";
import {getAuth} from "firebase/auth";
import {openNewTab} from "@/src/utils/common";
import ClaimSuccessModal from "@/src/components/common/FaucetClaim/components/ClaimSuccessModal/ClaimSuccessModal";
import useClaimFaucet from "@/src/hooks/useClaimFaucet/useClaimFaucet";
import {useAccount, useConnectUI, useDisconnect, useIsConnected} from "@fuels/react";
import {useLocalStorage} from "usehooks-ts";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import useFirebase from "@/src/hooks/useFirebase/useFirebase";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";

const FaucetClaim = () => {
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();
  const [SuccessModal, openSuccessModal] = useModal();

  const [followClicked, setFollowClicked] = useState(false);
  const [retweetClicked, setRetweetClicked] = useState(false);

  const [faucetRequirements, setRequirements] = useLocalStorage('faucetRequirements', { followClicked, retweetClicked });

  useEffect(() => {
    setFollowClicked(faucetRequirements.followClicked);
    setRetweetClicked(faucetRequirements.retweetClicked);
  }, [faucetRequirements]);

  const { isConnected } = useIsConnected();
  const { connect } = useConnectUI();
  const { disconnect } = useDisconnect();
  const { account } = useAccount();

  useFirebase();

  const { currentUser } = getAuth();
  const { data: twitterAuthData, mutateAsync: triggerTwitterAuth, reset } = useTwitterAuth();
  const userData = currentUser || twitterAuthData?.user;

  const handleConnectClick = async () => {
    await triggerTwitterAuth();
  };

  const handleDisconnectClick = async () => {
    const auth = getAuth();
    await auth.signOut();
    reset();
  };

  const allStepsCompleted = isConnected && userData && followClicked && retweetClicked;

  const { mutateAsync: claim, isPending } = useClaimFaucet();

  const handleClaimClick = useCallback(async () => {
    if (!allStepsCompleted) {
      openFailureModal();
      return;
    }

    const claimData = await claim();
    const result = await claimData?.waitForResult();
    if (result?.transactionResult.status === 'success') {
      openSuccessModal();
    }
  }, [allStepsCompleted, claim, openFailureModal, openSuccessModal]);

  const handleConnectWalletClick = () => {
    connect();
  };

  const handleDisconnectWalletClick = () => {
    disconnect();
  };

  const handleFollowClick = () => {
    openNewTab('https://x.com/MiraProtocol');
    setFollowClicked(true);
    setRequirements({ ...faucetRequirements, followClicked: true });
  };

  const handleRetweetClick = () => {
    openNewTab('https://x.com/intent/retweet?tweet_id=463440424141459456');
    setRetweetClicked(true);
    setRequirements({ ...faucetRequirements, retweetClicked: true });
  };

  const sufficientEthBalance = useCheckEthBalance();

  let ethFaucetLink = 'https://faucet-testnet.fuel.network/';
  if (account) {
    ethFaucetLink = ethFaucetLink.concat(`?address=${account}`);
  }

  const formattedAddress = useFormattedAddress(account);

  const promptEthClaim = isConnected && !sufficientEthBalance;

  return (
    <>
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <p>1</p>
          </div>
          {account ? (
            <div>
              {formattedAddress}
              &nbsp;
              <button className={styles.buttonLink} onClick={handleDisconnectWalletClick}>
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <button className={styles.buttonLink} onClick={handleConnectWalletClick}>
                Connect
              </button>
              &nbsp;
              Wallet
            </div>
          )}
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <p>2</p>
          </div>
          {userData ? (
            <div>
              {/* @ts-ignore */}
              @{userData.reloadUserInfo.screenName}
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
              X
            </div>
          )}
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <p>3</p>
          </div>
          <div>
            <button className={styles.buttonLink} onClick={handleFollowClick}>
              Follow
            </button>
            &nbsp;
            MIRA on X
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <p>4</p>
          </div>
          <button className={styles.buttonLink} onClick={handleRetweetClick}>
            Retweet
          </button>
        </div>
      </div>
      <div className={styles.buttonAndLink}>
        <ActionButton
          className={styles.claimButton}
          loading={isPending}
          onClick={handleClaimClick}
        >
          Claim $mimicMIRA
        </ActionButton>
        {promptEthClaim && (
          <p className={styles.ethFaucetText}>
            You&apos;ll need test ETH to complete the transaction. Get it
            &nbsp;
            <a href={ethFaucetLink} target="_blank">here</a>
          </p>
        )}
      </div>
      <FailureModal title={<TestnetLabel/>}>
        <ClaimFailureModal
          walletConnected={Boolean(isConnected)}
          twitterConnected={Boolean(userData)}
          followClicked={followClicked}
          retweetClicked={retweetClicked}
          closeModal={closeFailureModal}
        />
      </FailureModal>
      <SuccessModal title={<TestnetLabel />}>
        <ClaimSuccessModal />
      </SuccessModal>
    </>
  );
};

export default FaucetClaim;
