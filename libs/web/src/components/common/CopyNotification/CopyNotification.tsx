import {NotificationCheckboxIcon, TransactionsCloseIcon} from "@/meshwave-ui/icons";
import styles from "./CopyNotification.module.css";

export const CopyNotification: React.FC<{
  onClose: () => void;
}> = ({
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
