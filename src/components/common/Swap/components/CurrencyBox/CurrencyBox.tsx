import styles from './CurrencyBox.module.css';
import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useModal from "@/src/hooks/useModal/useModal";
import SearchIcon from "@/src/components/icons/Search/SearchIcon";

type Props = {
  mode: 'buy' | 'sell';
};

const CurrencyBox = ({ mode }: Props) => {
  const [Modal, openModal, closeModal] = useModal();
  
  return (
    <>
      <div className={styles.currencyBox}>
        <p className={styles.title}>{mode === 'buy' ? 'Buy' : 'Sell'}</p>
        <div className={styles.content}>
          <input className={styles.input} type="number" pattern="\d*" />
          <button className={styles.selector} onClick={openModal}>
            <Coin name={mode === 'buy' ? 'ETH' : 'USDT'} />
            <ChevronDownIcon />
          </button>
        </div>
        <p className={styles.estimate}>$41 626,62</p>
      </div>
      <Modal title="Choose token">
        <div className={styles.tokenSearch}>
          <SearchIcon />
          <input className={styles.tokenSearchInput} type="text" placeholder="Search by token or paste address"/>
        </div>
        <div className={styles.tokenList}>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="USDT"/>
          </div>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="USDC"/>
          </div>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="BTC"/>
          </div>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="ETH"/>
          </div>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="UNI"/>
          </div>
          <div className={styles.tokenListItem} onClick={closeModal}>
            <Coin name="DAI"/>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CurrencyBox;
