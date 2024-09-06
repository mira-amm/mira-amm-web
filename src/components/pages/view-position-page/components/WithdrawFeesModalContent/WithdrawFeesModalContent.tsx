import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import styles from './WithdrawFeesModalContent.module.css';
import {memo, useState} from "react";
import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";

type Props = {
  closeModal: () => void;
}

const WithdrawFeesModalContent = ({ closeModal }: Props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);

  const handleCollectClick = () => {
    if (loading) {
      return;
    }

    if (data) {
      closeModal();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setData('Data');
    }, 3000);
  };

  const buttonTitle = !loading && !data ? 'Collect' : 'Close';

  return (
    <div className={styles.withdrawFeesContent}>
      {data ? (
        <div className={styles.successAndLoading}>
          <SuccessIcon />
          <div className={styles.successAndLoadingTexts}>
            <p className={styles.maintext}>Success</p>
            <p className={styles.undertext}>Supplying 0.001 ETH and 10 USDT</p>
          </div>
        </div>
      ) : loading ? (
        <div className={styles.successAndLoading}>
          <LoaderV2 />
          <div className={styles.successAndLoadingTexts}>
            <p className={styles.maintext}>Pending transaction confirmation</p>
            <p className={styles.undertext}>Supplying 0.01 ETH and 10 USDT</p>
          </div>
        </div>
      ) : (
        <>
          <p className={styles.subtitle}>Collecting fees will withdraw all accumulated fees for this position</p>
          <div className={styles.coins}>
            <CoinWithAmount coin="USDT" amount="10"/>
            <CoinWithAmount coin="ETH" amount="0.001"/>
          </div>
        </>
      )}
      <ActionButton onClick={handleCollectClick} fullWidth>
        {buttonTitle}
      </ActionButton>
    </div>
  )
};

export default memo(WithdrawFeesModalContent);
