import {useCallback} from "react";
import {useRouter} from "next/navigation";

import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import DiscordIcon from "@/src/components/icons/Discord/DiscordIcon";
import {DiscordLink} from "@/src/utils/constants";

import styles from './ClaimSuccessModal.module.css';

const ClaimSuccessModal = () => {
  const router = useRouter();

  const handleButtonClick = useCallback(() => {
    router.push('/swap');
  }, [router]);

  return (
    <div className={styles.claimFailureModal}>
      <SuccessIcon />
      <p className={styles.mainText}>
        Seamless Mimicry!
        <br />
        Check your wallet
      </p>
      <p className={styles.subText}>
        Welcome to the MIRA world! Happy trading,
        <br />
        and may your strategies be ever successful
      </p>
      <div className={styles.discordBlock}>
        <div className={styles.discordIcon}>
          <DiscordIcon />
        </div>
        <p>
          <a href={DiscordLink} className={styles.discordLink} target="_blank">
            Join our Discord
          </a>
          &nbsp;
          to learn more about future activities
        </p>
      </div>
      <ActionButton onClick={handleButtonClick} className={styles.actionButton}>
        Make your first trade
      </ActionButton>
    </div>
  );
};

export default ClaimSuccessModal;
