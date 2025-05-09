import clsx from "clsx";
import {NotificationCheckboxIcon} from "../../icons/Checkbox/NotificationCheckboxIcon";
import CloseIcon from "../../icons/Close/CloseIcon";
import styles from "./CopyNotification.module.css";

interface CopyNotificationProps {
  onClose: () => void;
  text: string;
}

export const CopyNotification: React.FC<CopyNotificationProps> = ({
  onClose,
  text,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.messageArea}>
        <NotificationCheckboxIcon />
        <span className={clsx(styles.message, "mc-type-m")}>{text}</span>
      </div>
      <button onClick={onClose} className={styles.closeButton}>
        <CloseIcon />
      </button>
    </div>
  );
};
