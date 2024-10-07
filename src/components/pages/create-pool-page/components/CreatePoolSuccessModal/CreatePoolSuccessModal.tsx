import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import styles from '../../../add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {CoinName} from "@/src/utils/coinsConfig";

type Props = {
  coinA: CoinName;
  coinB: CoinName;
  firstCoinAmount: string;
  secondCoinAmount: string;
  transactionHash: string | undefined;
}

const CreatePoolSuccessModal = ({ coinA, coinB, firstCoinAmount, secondCoinAmount, transactionHash }: Props) => {
  const handleViewTransactionClick = useCallback(() => {
    if (!transactionHash) {
      return;
    }

    openNewTab(`https://app.fuel.network/tx/${transactionHash}/simple`);
  }, [transactionHash]);

  const subText = `Added ${firstCoinAmount} ${coinA} and ${secondCoinAmount} ${coinB}`;

  return (
    <div className={styles.claimFailureModal}>
      <SuccessIcon />
      <p className={styles.mainText}>Success</p>
      <p className={styles.subText}>
        {subText}
      </p>
      <ActionButton onClick={handleViewTransactionClick} className={styles.viewButton}>View transaction</ActionButton>
    </div>
  );
};

export default CreatePoolSuccessModal;