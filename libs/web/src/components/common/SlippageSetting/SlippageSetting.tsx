import clsx from "clsx";
import SettingsIcon from "../../icons/Settings/SettingsIcon";
import IconButton from "../IconButton/IconButton";
import styles from "./SlippageSetting.module.css";

type Props = {
  slippage: number;
  openSettingsModal: () => void;
  isDisabled: boolean;
};

export const SlippageSetting = ({
  slippage,
  openSettingsModal,
  isDisabled,
}: Props) => {
  const handleClick = () => {
    if (!isDisabled) openSettingsModal();
  };
  return (
    <>
      <p className={clsx(styles.slippageLabel, "mc-type-b")}>
        {slippage / 100}% Slippage
      </p>
      <IconButton onClick={handleClick} className={styles.settingsButton}>
        <SettingsIcon />
      </IconButton>
    </>
  );
};
