import React, {useState, useEffect} from "react";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";
import styles from "./ExchangeRate.module.css";
import {calculateFlooredRate} from "./utils";
import clsx from "clsx";
interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
}

interface ExchangeRateProps {
  coinAAmount: string;
  coinBAmount: string;
  assetAMetadata: AssetMetadata & {isLoading: boolean};
  assetBMetadata: AssetMetadata & {isLoading: boolean};
}

const ExchangeRate = ({
  assetBMetadata,
  assetAMetadata,
  coinAAmount,
  coinBAmount,
}: ExchangeRateProps): JSX.Element | null => {
  const [flooredRate, setFlooredRate] = useState("");
  const [isBaseCoinA, setIsBaseCoinA] = useState(true);

  const shouldDisplayExchange =
    assetBMetadata?.symbol &&
    assetAMetadata?.symbol &&
    flooredRate !== null &&
    flooredRate !== undefined &&
    flooredRate !== "NaN";

  useEffect(() => {
    setFlooredRate(
      calculateFlooredRate(
        coinAAmount,
        coinBAmount,
        isBaseCoinA,
        assetAMetadata?.decimals,
      ),
    );
  }, [coinAAmount, coinBAmount, isBaseCoinA, assetAMetadata?.decimals]);

  if (!shouldDisplayExchange) {
    return null;
  }

  return (
    <div className={styles.reserveItems}>
      <p className={styles.infoText}>Price</p>
      <div
        className={styles.exchangeRate}
        onClick={() => setIsBaseCoinA(!isBaseCoinA)}
      >
        <p className={clsx(styles.exchangeRate, styles.infoText)}>
          {isBaseCoinA
            ? `1 ${assetBMetadata.symbol} ≈ ${flooredRate} ${assetAMetadata.symbol}`
            : `1 ${assetAMetadata.symbol} ≈ ${flooredRate} ${assetBMetadata.symbol}`}
          <span>
            <ExchangeIcon />
          </span>
        </p>
      </div>
    </div>
  );
};

export default ExchangeRate;
