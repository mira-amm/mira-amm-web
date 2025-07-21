import {memo, ChangeEvent, useCallback} from "react";

import {clsx} from "clsx";
import {B256Address, BN} from "fuels";
import {ChevronDown} from "lucide-react";

import {Coin, FeatureGuard, TextButton} from "@/src/components/common";

import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";
import {MinEthValueBN} from "@/src/utils/constants";
import {useAssetMetadata, useIsRebrandEnabled} from "@/src/hooks";
import fiatValueFormatter from "@/src/utils/abbreviateNumber";

export function CurrencyBox({
  value,
  assetId,
  mode,
  balance,
  setAmount,
  loading,
  onCoinSelectorClick,
  usdRate,
  previewError,
  className,
}: {
  value: string;
  assetId: B256Address | null;
  mode: CurrencyBoxMode;
  balance: BN;
  setAmount: (amount: string) => void;
  loading: boolean;
  onCoinSelectorClick: (mode: CurrencyBoxMode) => void;
  usdRate: number | null;
  previewError?: string | null;
  className?: string;
}) {
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
    if (!loading) {
      onCoinSelectorClick(mode);
    }
  };

  const handleMaxClick = useCallback(() => {
    let amountStringToSet;
    if (metadata.symbol === "ETH" && mode === "sell") {
      const amountWithoutGasFee = balance.sub(MinEthValueBN);
      amountStringToSet = amountWithoutGasFee.gt(0)
        ? amountWithoutGasFee.formatUnits(metadata.decimals || 0)
        : balanceValue;
    } else {
      amountStringToSet = balanceValue;
    }
    setAmount(amountStringToSet);
  }, [assetId, mode, balance, setAmount, metadata]);

  const coinNotSelected = assetId === null;

  const numericValue = parseFloat(value);
  const usdValue =
    !isNaN(numericValue) && Boolean(usdRate)
      ? fiatValueFormatter(numericValue * usdRate!)
      : null;

  const rebrandEnabled = useIsRebrandEnabled();

  return (
    <div
      className={clsx(
        "flex flex-col gap-2.5 rounded-[10px] border border-transparent bg-background-tertiary dark:bg-background-secondary px-3 py-3 lg:px-4 focus-within:border-accent-secondary",
        className,
      )}
    >
      <p className="text-xs leading-4 text-content-tertiary dark:text-content-tertiary lg:text-sm lg:leading-[18px]">
        {mode === "buy" ? "Buy" : "Sell"}
      </p>

      <div className="min-h-[44px] flex items-center gap-2">
        {previewError ? (
          <div className="flex-1 bg-yellow-100/30 dark:bg-[rgba(255,235,59,0.1)] border border-yellow-500 dark:border-[rgba(255,235,59,0.3)] rounded-lg px-3 py-2">
            <p className="text-[#d4a900] text-sm font-medium leading-[1.4] lg:text-[15px]">
              {previewError}
            </p>
          </div>
        ) : (
          <input
            className={clsx(
              "flex-1 w-0 font-semibold text-[20px] leading-6 border-none bg-transparent outline-none",
              "text-content-secondary dark:text-content-secondary font-alt",
              loading && "text-gray-400/40 dark:text-content-tertiary/40"
            )}
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
            minLength={1}
            value={value}
            disabled={coinNotSelected || loading}
            onChange={handleChange}
          />
        )}

        <button
          onClick={handleCoinSelectorClick}
          disabled={loading}
          className={clsx(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-transparent text-content-grey",
            "hover:bg-background-grey-light dark:hover:bg-background-grey-dark disabled:cursor-default",
            coinNotSelected &&
              "bg-background-grey-dark hover:bg-background-grey-light cursor-pointer",
          )}
        >
          {coinNotSelected ? (
            <p className="font-medium text-[16px] leading-[19px] text-content-primary">
              Choose coin
            </p>
          ) : (
            <Coin assetId={assetId} />
          )}
          <ChevronDown className="w-4 h-4 lg:w-6 lg:h-6" />
        </button>
      </div>

      <div className="min-h-[16px] lg:min-h-[18px] flex justify-between items-center text-content-tertiary dark:text-content-tertiary">
        <p className="text-xs leading-4">{usdValue !== null && usdValue}</p>
        {balance.gt(0) && (
          <span className="text-xs leading-4 lg:text-sm">
            Balance: {balanceValue}{" "}
            <TextButton onClick={handleMaxClick}>Max</TextButton>
          </span>
        )}
      </div>
    </div>
  );
}
