import { useAccount, useDisconnect, useIsConnected } from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import { clsx } from "clsx";
import styles from "./ConnectButton.module.css";
import { useCallback, useState, useEffect, useMemo } from "react";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";
import { DropDownButtons } from "@/src/utils/DropDownButtons";
import { TouchCloseIcon } from "../../icons/DropDownClose/TouchCloseIcon";
import { CloseIcon } from "../../icons/DropDownClose/CloseIcon";
import { TransactionsHistory } from "../TransactionsHistory/TransactionsHistory";
import { CopyNotification } from "../../common/CopyNotification/CopyNotification";
import {openNewTab} from "@/src/utils/common";
import {toBech32} from "fuels";

type Props = {
  className?: string;
};

const DisconnectMobile = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const [isAddressCopied, setAddressCopied] = useState(false);

  useEffect(() => {
    if (isMenuOpened) {
      document.documentElement.style.overflowY = "hidden";
    } else {
      document.documentElement.style.overflowY = "";
    }

    return () => {
      document.documentElement.style.overflowY = "";
    };
  }, [isMenuOpened]);

  const bech32Address = account ? toBech32(account) : null;
  const formattedAddress = useFormattedAddress(bech32Address, false);

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
  }

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  }

  const handleExplorerClick = () => {
    openNewTab("https://app.fuel.network/");
  };

  const handleCopy = useCallback(async () => {
    if (isConnected && bech32Address) {
      try {
        await navigator.clipboard.writeText(bech32Address);
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 3000);
      } catch (error) {
        console.error("Failed to copy address: ", error);
      }
    }
  }, [bech32Address, isConnected]);

  const menuButtons = useMemo(() => {
    return DropDownButtons.map((button) => {
      if (button.text === "Transaction History") {
        return {
          ...button,
          disabled: true,
          tooltip: "soon",
          onClick: () => {},
        };
      }
  
      return {
        ...button,
        onClick:
          button.text === "Disconnect"
            ? handleDisconnect
            : button.text === "Copy Address"
            ? handleCopy
            : button.text === "View in Explorer"
            ? handleExplorerClick
            : button.onClick,
      };
    });
  }, [handleDisconnect, handleCopy]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <ActionButton
        className={clsx(className, styles.connected)}
        onClick={handleClick}
      >
        {isConnected && <img src="/images/avatar.png" width="16" height="16" />}
        {formattedAddress}
      </ActionButton>
      {isMenuOpened && (
        <div
          className={styles.dropDownOverlay}
        >
          <DropDownMenu buttons={menuButtons}>
            <button className={styles.dropDownTouchClose}>
              <TouchCloseIcon />
            </button>
            <button className={styles.dropDownClose} onClick={handleCloseMenu}>
              <CloseIcon />
            </button>
          </DropDownMenu>
        </div>
      )}
      <TransactionsHistory onClose={handleHistoryClose} isOpened={isHistoryOpened} />
      {isAddressCopied && <CopyNotification onClose={() => setAddressCopied(false)} />}
    </>
  );
};

export default DisconnectMobile;
