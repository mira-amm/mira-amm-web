import styles from './RemoveLiquidityModalContent.module.css';
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {
  ChangeEvent,
  Dispatch,
  memo,
  MouseEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from "react";
import {CoinName} from "@/src/utils/coinsConfig";
import {useDebounceCallback} from "usehooks-ts";

type Props = {
  coinA: CoinName;
  coinB: CoinName;
  coinAValue: string;
  coinBValue: string;
  liquidityValue: number;
  setLiquidityValue: Dispatch<SetStateAction<number>>
  closeModal: VoidFunction;
  handleRemoveLiquidity: VoidFunction;
}

const RemoveLiquidityModalContent = ({ coinA, coinB, coinAValue, coinBValue, closeModal, liquidityValue, setLiquidityValue, handleRemoveLiquidity }: Props) => {
  const [displayValue, setDisplayValue] = useState(liquidityValue);

  const sliderRef = useRef<HTMLInputElement>(null);

  const debouncedSetValue = useDebounceCallback(setLiquidityValue, 100);
  const handleMouseUp = (e: MouseEvent<HTMLInputElement>) => {
    // @ts-ignore
    debouncedSetValue(Number(e.target.value));
  };

  useEffect(() => {
    if (sliderRef.current) {
      document.documentElement.style.setProperty('--value', `${sliderRef.current.value}%`);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    document.documentElement.style.setProperty('--value', `${e.target.value}%`);
  };

  const handleMax = () => {
    debouncedSetValue(100);
    document.documentElement.style.setProperty('--value', '100%');
  };

  return (
    <div className={styles.removeLiquidityContent}>
      <CoinPair firstCoin={coinA} secondCoin={coinB} />
      <div className={styles.valueAndMax}>
        <p className={styles.value}>{displayValue}%</p>
        <button className={styles.maxButton} onClick={handleMax}>Max</button>
      </div>
      <input type="range"
             className={styles.slider}
             min={0}
             max={100}
             defaultValue={liquidityValue}
             onMouseUp={handleMouseUp}
             onChange={handleChange}
             ref={sliderRef}
      />
      {/*<div className={styles.someText}>*/}
      {/*  <p className={styles.dimmed}>Withdraw fees only</p>*/}
      {/*  <button className={styles.feesButton} onClick={handleFeesOnly}>Fees only</button>*/}
      {/*</div>*/}
      <div className={styles.tableWrapper}>
        <table className={styles.liquidityTable}>
          <thead>
          <tr>
            <th />
            <th>{coinA}</th>
            <th>{coinB}</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Initial</td>
            <td className="blurredText">6.03905</td>
            <td className="blurredText">9.34905</td>
          </tr>
          <tr>
            <td>Withdrawal fees</td>
            <td className="blurredText">0.0003</td>
            <td className="blurredText">0.0003</td>
          </tr>
          <tr>
            <td>Earned fees</td>
            <td className="blurredText">6.03905</td>
            <td className="blurredText">9.34905</td>
          </tr>
          <tr className={styles.lastRow}>
            <td>
              Total
            </td>
            <td>
              {coinAValue}
            </td>
            <td>
              {coinBValue}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.textBlock}>
        <p className={styles.infoBlockTitle}>
          <InfoIcon/>
          Pay attention
        </p>
        <p className={styles.infoBlockText}>
          This based on the current price of the pool. Your fees earned will always increase,
          but the principal amount may change with the price of the pool
        </p>
      </div>
      <div className={styles.buttons}>
        <ActionButton onClick={handleRemoveLiquidity}>Confirm</ActionButton>
        <ActionButton variant="outlined" onClick={closeModal}>Cancel</ActionButton>
      </div>
    </div>
  );
};

export default memo(RemoveLiquidityModalContent);
