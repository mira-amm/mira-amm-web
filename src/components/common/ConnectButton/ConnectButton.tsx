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
import { ArrowDownIcon } from "../../icons/ArrowDown/ArrowDownIcon";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";
import { ArrowUpIcon } from "../../icons/ArrowUp/ArrowUpIcon";
import { DropDownButtons } from "@/src/utils/DropDownButtons";
import { CopyNotification } from "../../common/CopyNotification/CopyNotification";
import { openNewTab } from "@/src/utils/common";
import TransactionsHistory from "@/src/components/common/TransactionsHistory/TransactionsHistory";

type Props = {
  className?: string;
};

const ConnectButton = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  const { disconnect, isPending: disconnectLoading } = useDisconnect();
  const { account } = useAccount();

  // TODO: Hack to avoid empty button when account is changed to the not connected one in wallet
  // It is not reproducible on Fuelet, but on Fuel wallet
  // isConnected remains `true` while account is `null` which is not correct
  // Consider creating an issue in Fuel repo
  // useEffect(() => {
  //   if (isConnected && !account) {
  //     disconnect();
  //   }
  // }, [account, isConnected]);

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

  const handleCopy = useCallback(async () => {
    if (isConnected && account) {
      try {
        await navigator.clipboard.writeText(account);
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 3000);
      } catch (error) {
        console.error("Failed to copy address: ", error);
      }
    }
  }, [account, isConnected]);

  const handleExplorerClick = () => {
    openNewTab(`https://app.fuel.network/account/${account}/transactions`);
  };

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
  };

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  };

  const menuButtons = useMemo(() => {
    return DropDownButtons.map((button) => {
      return {
        ...button,
        onClick:
          button.text === "Disconnect"
            ? handleDisconnect
            : button.text === "Transaction History"
            ? handleHistoryOpen
            : button.text === "Copy Address"
            ? handleCopy
            : button.text === "View in Explorer"
            ? handleExplorerClick
            : button.onClick,
      };
    });
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
        {isConnected && (!isMenuOpened ? <ArrowDownIcon /> : <ArrowUpIcon />)}
      </ActionButton>
      {isMenuOpened && <DropDownMenu buttons={menuButtons} />}
      <TransactionsHistory
        onClose={handleHistoryClose}
        isOpened={isHistoryOpened}
      />
      {isAddressCopied && (
        <CopyNotification onClose={() => setAddressCopied(false)} />
      )}
    </>
  );
};

export default ConnectButton;
