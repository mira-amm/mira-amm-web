import {useAccount, useDisconnect, useIsConnected} from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {clsx} from "clsx";
import styles from "./ConnectButton.module.css";
import {memo, useCallback} from "react";
import useModal from "@/src/hooks/useModal/useModal";

type Props = {
  className?: string;
};

const DisconnectMobile = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const [Modal, openModal, closeModal] = useModal();

  const formattedAddress = useFormattedAddress(account);

  const handleClick = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    closeModal();
  }, [disconnect, closeModal]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <ActionButton className={clsx(className, styles.connected)} onClick={handleClick}>
        {isConnected && (
          <img src="/images/avatar.png" width="16" height="16" />
        )}
        {formattedAddress}
      </ActionButton>
      <Modal title={
        <div className={styles.modalTitle}>
          <img src="/images/avatar.png" width="32" height="32" />
          <span>{formattedAddress}</span>
        </div>
      }>
        <div className={styles.modalContent}>
          <p className={styles.modalText}>Do you really want to disconnect this wallet?</p>
          <ActionButton onClick={handleDisconnect} className={styles.disconnectButton}>
            Disconnect
          </ActionButton>
        </div>
      </Modal>
    </>
  );
};

export default memo(DisconnectMobile);
