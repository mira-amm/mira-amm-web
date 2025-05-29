"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {ActionButton, DropDownMenu, CopyNotification } from "@/src/components/common";
import TransactionsHistory from "@/src/components/common/TransactionsHistory/TransactionsHistory";
import { useFormattedAddress } from "@/src/hooks";
import useWeb3React from "@/src/hooks/useWeb3Connection";
import { openNewTab } from "@/src/utils/common";
import { FuelAppUrl } from "@/src/utils/constants";
import { DropDownButtons } from "@/src/utils/DropDownButtons";
import { useScrollLock } from "usehooks-ts";
import { ArrowDownIcon, ArrowUpIcon } from "@/meshwave-ui/icons";

export function ConnectButton({ className, isWidget }: { className?: string; isWidget?: boolean }) {
  const { account, connect, disconnect, isConnected, isWalletLoading } = useWeb3React();
  const { lock, unlock } = useScrollLock({ autoLock: false });

  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const [isAddressCopied, setAddressCopied] = useState(false);

  const menuRef = useRef<HTMLUListElement>(null);
  const transactionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleClick = useCallback(() => {
    if (!isConnected) {
      handleConnection();
    } else {
      setMenuOpened((prev) => !prev);
    }
  }, [isConnected, handleConnection]);

  const formattedAddress = useFormattedAddress(account);

  const title = useMemo(() => (isConnected ? formattedAddress : "Connect Wallet"), [isConnected, formattedAddress]);

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

  const handleExplorerClick = () => openNewTab(`${FuelAppUrl}/account/${account}/transactions`);

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
    setMenuOpened(false);
  };

  const handleHistoryClose = () => setHistoryOpened(false);

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
    (button: { text: string }) =>
      !isWidget || button.text === "Disconnect" || button.text === "Copy Address",
    [isWidget],
  );

  const menuButtons = useMemo(
    () =>
      DropDownButtons.filter(filterButtons).map((button) => ({
        ...button,
        onClick: getOnClickHandler(button.text),
      })),
    [filterButtons, getOnClickHandler],
  );

  useEffect(() => {
    if (isHistoryOpened) lock();
    else unlock();
  }, [isHistoryOpened]);

  return (
    <>
      <div className="relative">
        <ActionButton
          className={clsx(
            className,
            isConnected &&
              "flex items-center gap-[10px] px-[8px] py-[16px] text-[var(--content-primary)] bg-transparent border border-[var(--accent-primary)] hover:shadow-none active:bg-transparent"
          )}
          onClick={handleClick}
          loading={isWalletLoading}
          ref={buttonRef}
        >
          {isConnected && <img src="/images/avatar.png" width="24" height="24" />}
          {title}
          {isConnected && (!isMenuOpened ? <ArrowDownIcon /> : <ArrowUpIcon />)}
        </ActionButton>

        {isMenuOpened && <DropDownMenu buttons={menuButtons} ref={menuRef} />}
        <TransactionsHistory onClose={handleHistoryClose} isOpened={isHistoryOpened} ref={transactionsRef} />
      </div>

      {isAddressCopied && <CopyNotification onClose={() => setAddressCopied(false)} />}
    </>
  );
}
