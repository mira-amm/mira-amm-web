'use client';

import {useCallback, useMemo} from 'react';
import {useAccount, useConnectUI, useDisconnect, useIsConnected} from "@fuels/react";
import {clsx} from "clsx";

import styles from './ConnectButton.module.css';

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import {toBech32} from "fuels";

type Props = {
  className?: string;
}

const ConnectButton = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { connect, isLoading, isConnecting } = useConnectUI();
  const { disconnect, isPending: disconnectLoading } = useDisconnect();
  const { account } = useAccount();

  const loading = isConnecting || disconnectLoading;

  const handleConnection = useCallback( () => {
    if (!isConnected) {
      connect();
    }

    if (isConnected) {
      disconnect();
    }
  }, [isConnected, connect, disconnect]);

  const handleClick = useCallback(() => {
    handleConnection();
  }, [handleConnection]);

  const formattedAddress = useFormattedAddress(account);

  const title = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return 'Connect Wallet';
  }, [isConnected, formattedAddress]);

  return (
    <ActionButton
      className={clsx(className, isConnected && styles.connected)}
      onClick={handleClick}
      loading={loading}
    >
      {isConnected && (
        <img src="/images/avatar.png" width="24" height="24" />
      )}
      {title}
      {isConnected && (
        <span className={styles.disconnectLabel}>
          Disconnect
        </span>
      )}
    </ActionButton>
  );
};

export default ConnectButton;
