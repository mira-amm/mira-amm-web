import styles from "./RemoveLiquidityModalContent.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import WarningIcon from "@/src/components/icons/Warning/WarningIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {
  ChangeEvent,
  Dispatch,
  memo,
  MouseEvent,
  TouchEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {B256Address} from "fuels";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";

type Props = {
  coinA: B256Address;
  coinB: B256Address;
  isStablePool: boolean;
  currentCoinAValue: string;
  currentCoinBValue: string;
  coinAValueToWithdraw: string;
  coinBValueToWithdraw: string;
  liquidityValue: number;
  setLiquidityValue: Dispatch<SetStateAction<number>>;
  closeModal: VoidFunction;
  handleRemoveLiquidity: VoidFunction;
  isValidNetwork: boolean;
  isLoading: boolean;
};

const RemoveLiquidityModalContent = ({
  coinA,
  coinB,
  isStablePool,
  currentCoinAValue,
  currentCoinBValue,
  coinAValueToWithdraw,
  coinBValueToWithdraw,
  closeModal,
  liquidityValue,
  setLiquidityValue,
  handleRemoveLiquidity,
  isValidNetwork,
  isLoading,
}: Props) => {
  const [displayValue, setDisplayValue] = useState(liquidityValue);
  const coinAMetadata = useAssetMetadata(coinA);
  const coinBMetadata = useAssetMetadata(coinB);

  const sliderRef = useRef<HTMLInputElement>(null);

  const debouncedSetValue = useDebounceCallback(setLiquidityValue, 500);
  const handleMouseUp = (
    e: MouseEvent<HTMLInputElement> | TouchEvent<HTMLInputElement>,
  ) => {
    // @ts-ignore
    debouncedSetValue(Number(e.target.value));
  };

  useEffect(() => {
    if (sliderRef.current) {
      document.documentElement.style.setProperty(
        "--value",
        `${sliderRef.current.value}%`,
      );
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    document.documentElement.style.setProperty("--value", `${e.target.value}%`);
  };

  const handleMax = () => {
    debouncedSetValue(100);
    document.documentElement.style.setProperty("--value", "100%");
  };

  const withdrawalDisabled = !isValidNetwork;

  let buttonTitle = "Confirm";
  if (withdrawalDisabled) {
    buttonTitle = "Incorrect network";
  }

  return (
    <div className={styles.removeLiquidityContent}>
      <CoinPair
        firstCoin={coinA}
        secondCoin={coinB}
        isStablePool={isStablePool}
      />
      <div className={styles.valueAndMax}>
        <p className={styles.value}>{displayValue}%</p>
        <button className={styles.maxButton} onClick={handleMax}>
          Max
        </button>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        defaultValue={liquidityValue}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
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
              <th>{coinAMetadata.symbol}</th>
              <th>{coinBMetadata.symbol}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Current position</td>
              <td>{currentCoinAValue}</td>
              <td>{currentCoinBValue}</td>
            </tr>
            <tr className={styles.lastRow}>
              <td>Remove</td>
              <td>{coinAValueToWithdraw}</td>
              <td>{coinBValueToWithdraw}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.textBlock}>
        <p className={styles.infoBlockTitle}>
          <WarningIcon />
          Pay attention
        </p>
        <p className={styles.infoBlockText}>
          This based on the current price of the pool. Your fees earned will
          always increase, but the principal amount may change with the price of
          the pool
        </p>
      </div>
      <div className={styles.buttons}>
        <ActionButton
          onClick={handleRemoveLiquidity}
          disabled={withdrawalDisabled}
          loading={isLoading}
        >
          {buttonTitle}
        </ActionButton>
        <ActionButton
          variant="outlined"
          onClick={closeModal}
          disabled={isLoading}
        >
          Cancel
        </ActionButton>
      </div>
    </div>
  );
};

export default memo(RemoveLiquidityModalContent);
