import { useAccount, useDisconnect, useIsConnected } from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import { clsx } from "clsx";
import styles from "./ConnectButton.module.css";
import { useCallback, useState, useEffect, useRef } from "react";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";
import { DropDownButtons } from "@/src/utils/DropDownButtons";
import { TouchCloseIcon } from "../../icons/DropDownClose/TouchCloseIcon";
import { CloseIcon } from "../../icons/DropDownClose/CloseIcon";
import { TransactionsHistory } from "../TransactionsHistory/TransactionsHistory";

type Props = {
  className?: string;
};

const DisconnectMobile = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMenuOpened, setMenuOpened] = useState(false);
  const [isHistoryOpened, setHistoryOpened] = useState(false);

  // const touchStartY = useRef(0);
  // const touchEndY = useRef(0);

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

  const formattedAddress = useFormattedAddress(account);

  const handleClick = () => {
    setMenuOpened((prev) => !prev);
  };

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  if (!isConnected) {
    return null;
  }

  const handleCloseMenu = () => {
    setMenuOpened(false);
  };

  const handleHistoryOpen = () => {
    setHistoryOpened(true);
  }

  const handleHistoryClose = () => {
    setHistoryOpened(false);
  }

  const handleCopy = () => {
    if (navigator.clipboard && formattedAddress !== "Connect Wallet") {
      navigator.clipboard.writeText(formattedAddress).then(
        () => {
          console.log("Address copied to clipboard!");
        },
        (err) => {
          console.error("Failed to copy address: ", err);
        }
      );
    }
  };

  // const onTouchStart = (e: React.TouchEvent) => {
  //   touchStartY.current = e.touches[0].clientY;
  // };

  // const onTouchMove = (e: React.TouchEvent) => {
  //   touchEndY.current = e.touches[0].clientY;
  // };

  // const onTouchEnd = () => {
  //   if (touchStartY.current < touchEndY.current - 50) {
  //     setMenuOpened(false);
  //   }
  // };

  const menuButtons = DropDownButtons.map((button) => ({
    ...button,
    onClick: 
    button.text === "Disconnect" 
    ? handleDisconnect
    : button.text === "Transaction History"
    ? handleHistoryOpen
    : button.text === "Copy Address"
    ? handleCopy
    : button.onClick,
  }));

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
          // onTouchStart={onTouchStart}
          // onTouchMove={onTouchMove}
          // onTouchEnd={onTouchEnd}
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
    </>
  );
};

export default DisconnectMobile;
