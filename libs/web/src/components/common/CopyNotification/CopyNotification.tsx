import {NotificationCheckboxIcon} from "../../icons/NotificationCheckboxIcon";
import {TransactionsCloseIcon} from "../../icons/TransactionsCloseIcon";
import styles from "./CopyNotification.module.css";

interface CopyNotificationProps {
  onClose: () => void;
}

export const CopyNotification: React.FC<CopyNotificationProps> = ({
  onClose,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.messageArea}>
        <NotificationCheckboxIcon />
        <span className={styles.message}>Copied address</span>
      </div>
      <button onClick={onClose} className={styles.closeButton}>
        <TransactionsCloseIcon />
      </button>
    </div>
  );
};
