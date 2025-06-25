import {useState, useEffect} from "react";
import {ArrowLeftRight} from "lucide-react";
import {DefaultLocale} from "@/src/utils/constants";

const shouldTrimDecimals = (rate: string, decimalPlaces?: number): boolean => {
  if (!decimalPlaces) return false;
  const decimalIndex = rate.lastIndexOf('.');
  if (decimalIndex === -1) return false;
  const decimalPortion = rate.slice(decimalIndex + 1);
  return decimalPortion.split("").every((char) => char === "0");
};

export const calculateFlooredRate = (
  coinAAmount: string,
  coinBAmount: string,
  isBaseCoinA: boolean,
  decimals: number | undefined,
): string => {
  const rate = isBaseCoinA
    ? parseFloat(coinAAmount) / parseFloat(coinBAmount)
    : parseFloat(coinBAmount) / parseFloat(coinAAmount);

  const rateWithDecimals = rate.toLocaleString(DefaultLocale, {
    minimumFractionDigits: decimals || 0,
  });

  return rate.toLocaleString(DefaultLocale, {
    minimumFractionDigits: shouldTrimDecimals(rateWithDecimals, decimals)
      ? 0
      : decimals || 0,
  });
};

interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
}

export function ExchangeRate({
  assetBMetadata,
  assetAMetadata,
  coinAAmount,
  coinBAmount,
}: {
  coinAAmount: string;
  coinBAmount: string;
  assetAMetadata: AssetMetadata & {isLoading: boolean};
  assetBMetadata: AssetMetadata & {isLoading: boolean};
}){
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
    <div className="flex items-center justify-between text-content-tertiary">
      <p className="text-[16px] font-normal leading-[19px]">Price</p>
      <div
        className="flex cursor-pointer"
        onClick={() => setIsBaseCoinA(!isBaseCoinA)}
      >
        <p className="flex items-center">
          {isBaseCoinA
            ? `1 ${assetBMetadata.symbol} ≈ ${flooredRate} ${assetAMetadata.symbol}`
            : `1 ${assetAMetadata.symbol} ≈ ${flooredRate} ${assetBMetadata.symbol}`}
          <span className="ml-[4px]">
            <ArrowLeftRight className="size-4" />
          </span>
        </p>
      </div>
    </div>
  );
};
