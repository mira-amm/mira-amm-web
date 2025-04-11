import {ChangeEvent, memo, useCallback} from "react";
import {clsx} from "clsx";

import Coin from "@/src/components/common/Coin/Coin";
import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";

import styles from "./CurrencyBox.module.css";
import TextButton from "@/src/components/common/TextButton/TextButton";
import {MinEthValueBN} from "@/src/utils/constants";
import {B256Address, BN} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import fiatValueFormatter from "@/src/utils/abbreviateNumber";

type BaseProps = {
  value: string;
  assetId: B256Address | null;
  balance: BN;
  setAmount: (amount: string) => void;
  loading?: boolean;
  usdRate: number | null;
  previewError?: string | null;
  isDisabled?: boolean;
  className?: string;
};

type SwapPageProps = BaseProps & {
  mode: CurrencyBoxMode;
  onCoinSelectorClick?: (param: CurrencyBoxMode) => void;
};

type LiquidityPageProps = BaseProps & {
  mode?: never;
  onCoinSelectorClick?: () => void;
};

type Props = SwapPageProps | LiquidityPageProps;

const CurrencyBox = ({
  value,
  assetId,
  mode,
  balance,
  setAmount,
  loading,
  onCoinSelectorClick,
  usdRate,
  previewError,
  isDisabled,
  className,
}: Props) => {
  const metadata = useAssetMetadata(assetId);
  const balanceValue = balance.formatUnits(metadata.decimals || 0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(",", ".");
    const re = new RegExp(`^[0-9]*[.]?[0-9]{0,${metadata.decimals || 0}}$`);

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleCoinSelectorClick = () => {
    if (!loading && onCoinSelectorClick) {
      if (mode) {
        onCoinSelectorClick(mode);
      } else {
        onCoinSelectorClick();
      }
    }
  };

  const handleMaxClick = useCallback(() => {
    if (!balance.gt(0)) return;
    let amountStringToSet;
    // TODO ETH AssetId
    if (metadata.symbol === "ETH" && mode === "sell") {
      const amountWithoutGasFee = balance.sub(MinEthValueBN);
      amountStringToSet = amountWithoutGasFee.gt(0)
        ? amountWithoutGasFee.formatUnits(metadata.decimals || 0)
        : balanceValue;
    } else {
      amountStringToSet = balanceValue;
    }

    setAmount(amountStringToSet);
  }, [
    balance,
    metadata.symbol,
    metadata.decimals,
    mode,
    setAmount,
    balanceValue,
  ]);

  const coinNotSelected = assetId === null;

  const numericValue = parseFloat(value);
  const usdValue =
    !isNaN(numericValue) && Boolean(usdRate)
      ? fiatValueFormatter(numericValue * usdRate!)
      : !Boolean(usdRate)
        ? "-"
        : fiatValueFormatter(0);

  return (
    <div className={clsx(styles.currencyBox, className)}>
      {mode && (
        <p className={clsx(styles.title, "mc-type-s")}>
          {mode === "buy" ? "Buy" : "Sell"}
        </p>
      )}
      <div className={styles.content}>
        {previewError ? (
          <div className={styles.warningBox}>
            <p className={clsx(styles.warningLabel, "mc-type-b")}>
              {previewError}
            </p>
          </div>
        ) : (
          <input
            className={clsx(
              styles.input,
              "mc-mono-xxl",
              loading && "blurredTextLight",
            )}
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
            minLength={1}
            value={value}
            disabled={coinNotSelected || loading || isDisabled}
            onChange={handleChange}
          />
        )}
        <Coin
          assetId={assetId}
          onClick={handleCoinSelectorClick}
          coinSelectionDisabled={!Boolean(onCoinSelectorClick)}
        />
      </div>
      {assetId && (
        <div className={styles.estimateAndBalance}>
          <p className={clsx(styles.fiatValue, "mc-mono-s")}>{`${usdValue}`}</p>
          <span className={clsx(styles.balance, "mc-type-s")}>
            Balance:{" "}
            <span className="mc-mono-s">
              {balance.gt(0) ? balanceValue : 0}
            </span>
            &nbsp;
            <TextButton
              isDisabled={coinNotSelected || loading || isDisabled}
              onClick={handleMaxClick}
            >
              Max
            </TextButton>
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(CurrencyBox);
