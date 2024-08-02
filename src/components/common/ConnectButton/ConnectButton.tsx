'use client';

import {useCallback, useContext, useMemo} from 'react';
import {useAccount, useConnect, useConnectUI, useDisconnect, useIsConnected} from "@fuels/react";
import {clsx} from "clsx";

import styles from './ConnectButton.module.css';

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import {usePersistentConnector} from "@/src/core/providers/PersistentConnector";

type Props = {
  className?: string;
}

const ConnectButton = ({ className }: Props) => {
  const { connect, disconnect } = usePersistentConnector();
  const { isConnected } = useIsConnected();
  const { isLoading, isConnecting } = useConnectUI();
  const { isPending: disconnectLoading } = useDisconnect();
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
