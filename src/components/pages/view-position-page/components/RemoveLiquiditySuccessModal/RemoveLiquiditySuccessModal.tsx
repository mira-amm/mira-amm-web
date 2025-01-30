import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import styles from "./RemoveLiquiditySuccessModal.module.css";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {CoinName} from "@/src/utils/coinsConfig";
import useAppUrl from "@/src/hooks/useAppUrl";

type Props = {
  coinA: CoinName;
  coinB: CoinName;
  firstCoinAmount: string;
  secondCoinAmount: string;
  transactionHash: string | undefined;
};

const RemoveLiquiditySuccessModal = ({
  coinA,
  coinB,
  firstCoinAmount,
  secondCoinAmount,
  transactionHash,
}: Props) => {
  const appUrl = useAppUrl();

  const handleViewTransactionClick = useCallback(() => {
    if (!transactionHash) {
      return;
    }

    openNewTab(`${appUrl}/tx/${transactionHash}/simple`);
  }, [appUrl, transactionHash]);

  const subText = `Removed ${firstCoinAmount} ${coinA} and ${secondCoinAmount} ${coinB}`;

  return (
    <div className={styles.claimFailureModal}>
      <SuccessIcon />
      <p className={styles.mainText}>Success</p>
      <p className={styles.subText}>{subText}</p>
      <ActionButton
        onClick={handleViewTransactionClick}
        className={styles.viewButton}
      >
        View transaction
      </ActionButton>
    </div>
  );
};

export default RemoveLiquiditySuccessModal;
