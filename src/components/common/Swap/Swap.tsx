import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";

import styles from "./Swap.module.css";
import SettingsIcon from "@/src/components/icons/Settings/SettingsIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";

const Swap = () => {
  const [Modal, openModal, closeModal] = useModal();

  return (
    <>
      <div className={styles.swapContainer}>
        <div className={styles.heading}>
          <p className={styles.title}>Swap</p>
          <IconButton onClick={openModal} className={styles.settingsButton}>
            <SettingsIcon />
          </IconButton>
        </div>
        <CurrencyBox mode="sell" />
        <div className={styles.splitter}>
          <IconButton onClick={() => {}} className={styles.convertButton}>
            <ConvertIcon />
          </IconButton>
        </div>
        <CurrencyBox mode="buy" />
        <ActionButton variant="secondary">
          Connect Wallet
        </ActionButton>
      </div>
      <Modal title="Settings">
        <div className={styles.settingsContainer}>
          <div className={styles.settingsSection}>
            <p>Slippage Tolerance</p>
            <p className={styles.settingsText}>The amount the price can change unfavorably before the trade reverts</p>
          </div>
          <div className={styles.settingsSection}>
            <div className={styles.slippageButtons}>
              <button className={styles.slippageButton}>Auto</button>
              <button className={styles.slippageButton}>Custom</button>
            </div>
            <input type="text" className={styles.slippageInput} value="1%" />
          </div>
          <div className={styles.settingsSection}>
            <p className={styles.infoHeading}><InfoIcon/>Pay attention</p>
            <p className={styles.settingsText}>Customized price impact limit may lead to loss of funds. Use it at your own risk</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Swap;
