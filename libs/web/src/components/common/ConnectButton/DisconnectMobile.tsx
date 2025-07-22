"use client";

import {useCallback, useState, useEffect, useMemo, useRef} from "react";
import {Button} from "@/meshwave-ui/Button";
import {clsx} from "clsx";
import {TouchCloseIcon} from "@/meshwave-ui/icons";
import {X} from "lucide-react";

import {useAccount, useDisconnect, useIsConnected} from "@fuels/react";

import {useScrollLock} from "usehooks-ts";
import {useFormattedAddress} from "@/src/hooks";

import {DropDownMenu, TransactionsHistory} from "@/src/components/common";

import {DropDownButtons} from "@/src/utils/DropDownButtons";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";
import {toast} from "sonner";

export function DisconnectMobile({className}: {className?: string}) {
  const {isConnected} = useIsConnected();
  const {account} = useAccount();
  const {disconnect} = useDisconnect();

  const {lock, unlock} = useScrollLock({autoLock: false});

  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);

  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpened(false);
      }
    };

    if (isMenuOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpened]);

  useEffect(() => {
    if (isMenuOpened) {
      lock();
    } else {
      unlock();
    }
  }, [isMenuOpened]);

  const formattedAddress = useFormattedAddress(account);

  const handleClick = () => {
    setMenuOpened((prev) => !prev);
  };

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleCloseMenu = () => {
    setMenuOpened(false);
  };

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
  };

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  };

  const handleExplorerClick = () => {
    openNewTab(`${FuelAppUrl}/account/${account}/transactions`);
  };

  const handleCopy = useCallback(async () => {
    if (isConnected && account) {
      try {
        await navigator.clipboard.writeText(account);
        toast.success("Copied address");
      } catch (error) {
        console.error("Failed to copy address: ", error);
      }
    }
  }, [account, isConnected]);

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
  }, [handleDisconnect, handleCopy, handleExplorerClick]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <Button
        className={clsx(
          className,
          "flex items-center gap-2 px-3 py-2 text-content-primary border border-accent-primary bg-transparent shadow-none hover:shadow-none hover:bg-transaparent"
        )}
        onClick={handleClick}
      >
        <img src="/images/avatar.png" width="16" height="16" />
        {formattedAddress}
      </Button>

      {isMenuOpened && (
        <div className="absolute top-0 left-0 z-[100] w-full h-screen bg-black/35 backdrop-blur-sm">
          <DropDownMenu buttons={menuButtons} ref={menuRef}>
            <button className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-transparent border-none p-0">
              <TouchCloseIcon />
            </button>
            <button
              className="absolute top-4 right-4 bg-transparent border-none p-0"
              onClick={handleCloseMenu}
            >
              <X />
            </button>
          </DropDownMenu>
        </div>
      )}

      <TransactionsHistory
        onClose={handleHistoryClose}
        isOpened={isHistoryOpened}
      />
    </>
  );
}
