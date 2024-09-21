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

type Props = {
  className?: string;
};

const DisconnectMobile = ({ className }: Props) => {
  const { isConnected } = useIsConnected();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMenuOpened, setMenuOpened] = useState(false);

  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

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

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    if (touchStartY.current < touchEndY.current - 50) {
      setMenuOpened(false);
    }
  };

  const menuButtons = DropDownButtons.map((button) => ({
    ...button,
    onClick: button.text === "Disconnect" ? handleDisconnect : button.onClick,
  }));

  const handleCloseMenu = () => {
    setMenuOpened(false);
  };

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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
    </>
  );
};

export default DisconnectMobile;
