import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";
import styles from "./index.module.css";
import clsx from "clsx";

export enum ModalType {
  "SUCCESS",
  "ERROR",
}

type StatusModalProps = {
  type: ModalType;
  transactionHash?: string;
  title: string;
  subTitle: string | React.ReactNode;
};

const StatusModal = ({
  subTitle,
  title,
  transactionHash,
  type,
}: StatusModalProps) => {
  const handleViewTransactionClick = useCallback(() => {
    if (!transactionHash) {
      return;
    }

    openNewTab(`${FuelAppUrl}/tx/${transactionHash}/simple`);
  }, [transactionHash]);

  return (
    <div className={styles.statusModal}>
      {type === ModalType.SUCCESS ? <SuccessIcon /> : <FailureIcon />}
      <div className={styles.statusContent}>
        <p className={clsx(styles.mainText, "mc-type-xxl")}>{title}</p>
        <div
          className={clsx(
            styles.subTextContainer,
            !transactionHash && styles.subTextOnly,
          )}
        >
          <p className={clsx(styles.subText, "mc-type-l")}>{subTitle}</p>
        </div>
      </div>
      {transactionHash && (
        <ActionButton
          onClick={handleViewTransactionClick}
          fullWidth
          size={"big"}
        >
          View transaction
        </ActionButton>
      )}
    </div>
  );
};

export default StatusModal;
