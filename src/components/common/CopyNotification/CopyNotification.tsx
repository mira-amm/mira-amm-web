import { NotificationCheckbox } from "../../icons/Checkbox/NotificationCheckbox";
import { TransactionsCloseIcon } from "../../icons/Close/TransactionsCloseIcon";
import styles from "./CopyNotification.module.css";


export const CopyNotification = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.messageArea}>
        <NotificationCheckbox />
        <span className={styles.message}>Copied address</span>
      </div>
      <TransactionsCloseIcon />
    </div>
  );
};
