"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useAccount,
  useConnectUI,
  useDisconnect,
  useIsConnected,
} from "@fuels/react";
import { clsx } from "clsx";

import styles from "./ConnectButton.module.css";

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import { toBech32 } from "fuels";
import { ArrowDown } from "../../icons/ArrowDown/ArrowDown";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";
import { ArrowUp } from "../../icons/ArrowUp/ArrowUp";
import { DropDownButtons } from "@/src/utils/DropDownButtons";
import { TransactionsHistory } from "../TransactionsHistory/TransactionsHistory";
import { CopyNotification } from "../../common/CopyNotification/CopyNotification";

type Props = {
  className?: string;
};

const ConnectButton = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { connect, isLoading, isConnecting } = useConnectUI();
  const { disconnect, isPending: disconnectLoading } = useDisconnect();
  const { account } = useAccount();

  const loading = isConnecting || disconnectLoading;

  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const [isAddressCopied, setAddressCopied] = useState(false);

  const handleConnection = useCallback(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setMenuOpened(false);
  }, [disconnect]);

  const handleClick = useCallback(() => {
    if (!isConnected) {
      handleConnection();
    } else {
      setMenuOpened((prev) => !prev);
    }
  }, [isConnected, handleConnection]);

  const formattedAddress = useFormattedAddress(account);

  const title = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return "Connect Wallet";
  }, [isConnected, formattedAddress]);

  const handleCopy = useCallback(() => {
    if (navigator.clipboard && title !== "Connect Wallet") {
      navigator.clipboard.writeText(title).then(
        () => {
          console.log("Address copied to clipboard!");
          setAddressCopied(true);
          setTimeout(() => setAddressCopied(false), 3000);
        },
        (err) => {
          console.error("Failed to copy address: ", err);
        }
      );
    }
  }, [title]);

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
  }

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  }

  const menuButtons = useMemo(() => {
    return DropDownButtons.map((button) => ({
      ...button,
      onClick:
        button.text === "Disconnect"
          ? handleDisconnect
          : button.text === "Copy Address"
          ? handleCopy
          : button.text === "Transaction History"
          ? handleHistoryOpen
          : button.onClick,
    }));
  }, [handleDisconnect, handleCopy]);

  useEffect(() => {
    if (isHistoryOpened) {
      document.documentElement.style.overflowY = "hidden";
    } else {
      document.documentElement.style.overflowY = "";
    }

    return () => {
      document.documentElement.style.overflowY = "";
    };
  }, [isHistoryOpened]);

  return (
    <>
      <ActionButton
        className={clsx(className, isConnected && styles.connected)}
        onClick={handleClick}
        loading={loading}
      >
        {isConnected && <img src="/images/avatar.png" width="24" height="24" />}
        {title}
        {isConnected &&
          // <span className={styles.disconnectLabel}>
          //   Disconnect
          // </span>
          (!isMenuOpened ? (
              <ArrowDown />
          ) : (
              <ArrowUp />
          ))}
      </ActionButton>
      {isMenuOpened && <DropDownMenu buttons={menuButtons} />}
      <TransactionsHistory onClose={handleHistoryClose} isOpened={isHistoryOpened} />
      {isAddressCopied && <CopyNotification />}
    </>
  );
};

export default ConnectButton;
