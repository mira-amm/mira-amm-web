import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import styles from "./AddLiquiditySuccessModal.module.css";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {CoinName} from "@/src/utils/coinsConfig";
import {FuelAppUrl} from "@/src/utils/constants";
import clsx from "clsx";

type Props = {
  coinA: CoinName;
  coinB: CoinName;
  firstCoinAmount: string;
  secondCoinAmount: string;
  transactionHash: string | undefined;
};

const AddLiquiditySuccessModal = ({
  coinA,
  coinB,
  firstCoinAmount,
  secondCoinAmount,
  transactionHash,
}: Props) => {
  const handleViewTransactionClick = useCallback(() => {
    if (!transactionHash) {
      return;
    }

    openNewTab(`${FuelAppUrl}/tx/${transactionHash}/simple`);
  }, [transactionHash]);

  const subText = `Added ${firstCoinAmount} ${coinA} and ${secondCoinAmount} ${coinB}`;

  return (
    <div className={styles.claimFailureModal}>
      <SuccessIcon />
      <p className={clsx(styles.mainText, "mc-type-xxl")}>Success</p>
      <p className={clsx(styles.subText, "mc-type-b")}>{subText}</p>
      <ActionButton onClick={handleViewTransactionClick} fullWidth>
        View transaction
      </ActionButton>
    </div>
  );
};

export default AddLiquiditySuccessModal;
