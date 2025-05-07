"use client";

import {clsx} from "clsx";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import styles from "./ConnectButton.module.css";
import actionButtonStyles from "../ActionButton/ActionButton.module.css";

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import TransactionsHistory from "@/src/components/common/TransactionsHistory/TransactionsHistory";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import useWeb3React from "@/src/hooks/useWeb3Connection";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";
import {DropDownButtons} from "@/src/utils/DropDownButtons";
import {useScrollLock} from "usehooks-ts";
import {CopyNotification} from "../../common/CopyNotification/CopyNotification";
import DropDownMenu from "../DropDownMenu/DropDownMenu";
import ChevronDownIcon from "../../icons/ColoredArrowDown/ChevronDownIcon";
import ChevronUpIcon from "../../icons/ColoredArrowUp/ChevronUpIcon";

type Props = {
  className?: string;
  isWidget?: boolean;
};

const ConnectButton = ({className, isWidget}: Props) => {
  const {account, connect, disconnect, isConnected, isWalletLoading} =
    useWeb3React();

  const {lock, unlock} = useScrollLock({autoLock: false});

  // TODO: Hack to avoid empty button when account is changed to the not connected one in wallet
  // It is not reproducible on Fuelet, but on Fuel wallet
  // isConnected remains `true` while account is `null` which is not correct
  // Consider creating an issue in Fuel repo
  // useEffect(() => {
  //   if (isConnected && !account) {
  //     disconnect();
  //   }
  // }, [account, isConnected]);

  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const [isAddressCopied, setAddressCopied] = useState(false);

  const menuRef = useRef<HTMLUListElement>(null);
  const transactionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // TODO: Ugly, rewrite all modals/dropdowns/notifications/sidenavs to the separate logic layer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef?.current?.contains(event.target as Node)
      ) {
        setMenuOpened(false);
      }
    };

    const handleClickOutsideTransactions = (event: MouseEvent) => {
      if (
        transactionsRef.current &&
        !transactionsRef.current.contains(event.target as Node)
      ) {
        setHistoryOpened(false);
      }
    };

    if (isMenuOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    if (isHistoryOpened) {
      document.addEventListener("mousedown", handleClickOutsideTransactions);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideTransactions);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideTransactions);
    };
  }, [isMenuOpened, isHistoryOpened]);

  const handleConnection = useCallback(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setMenuOpened(false);
  }, [disconnect]);

  const formattedAddress = useFormattedAddress(account);

  const title = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return "NO WALLET CONNECTED";
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
    openNewTab(`${FuelAppUrl}/account/${account}/transactions`);
  };

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
    setMenuOpened(false);
  };

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  };

  const getOnClickHandler = useCallback(
    (text: string) => {
      switch (text) {
        case "Disconnect":
          return handleDisconnect;
        case "Transaction History":
          return handleHistoryOpen;
        case "Copy Address":
          return handleCopy;
        case "View in Explorer":
          return handleExplorerClick;
        default:
          return () => {};
      }
    },
    [handleCopy, handleDisconnect, handleExplorerClick],
  );

  const filterButtons = useCallback(
    (button: {text: string}) => {
      return (
        !isWidget ||
        button.text === "Disconnect" ||
        button.text === "Copy Address"
      );
    },
    [isWidget],
  );

  const menuButtons = useMemo(() => {
    return DropDownButtons.filter(filterButtons).map((button) => ({
      ...button,
      onClick: getOnClickHandler(button.text),
    }));
  }, [filterButtons, getOnClickHandler]);

  useEffect(() => {
    if (isHistoryOpened) {
      lock();
    } else {
      unlock();
    }
  }, [isHistoryOpened]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.connectionContainer}>
          <div className={styles.connectionLeft}>
            <div className={styles.powerContainer}>
              <p className={clsx("mc-type-s")}>Power</p>
              <div
                className={clsx(
                  styles.powerIndicator,
                  isConnected ? styles.powerOn : styles.powerOff,
                )}
              ></div>
            </div>
            <ActionButton
              variant={"primary"}
              size="small"
              onClick={isConnected ? handleDisconnect : handleConnection}
              loading={isWalletLoading}
              className={clsx(isConnected && styles.connectBtn)}
            >
              {isConnected ? "DISCONNECT" : "CONNECT"}
            </ActionButton>
          </div>
          <div>
            <div
              ref={buttonRef}
              onClick={() => {
                if (isConnected) setMenuOpened((prev) => !prev);
              }}
              className={clsx(
                styles.fakeSelect,
                isConnected && styles.walletConnected,
              )}
            >
              <span className={clsx("mc-mono-s")}>{title}</span>
              {isConnected && (
                <span className={styles.chevron}>
                  {isMenuOpened ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </span>
              )}
            </div>
          </div>
        </div>
        {isMenuOpened && <DropDownMenu buttons={menuButtons} ref={menuRef} />}
        <TransactionsHistory
          onClose={handleHistoryClose}
          isOpened={isHistoryOpened}
          ref={transactionsRef}
        />
      </div>
      {isAddressCopied && (
        <CopyNotification
          onClose={() => setAddressCopied(false)}
          text={"Copied address"}
        />
      )}
    </>
  );
};

export default ConnectButton;
