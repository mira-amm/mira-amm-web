import {DefaultLocale} from "@/src/utils/constants";

const shouldTrimDecimals = (rate: string, decimalPlaces?: number): boolean => {
  if (!decimalPlaces) return false;
  return rate
    .slice(-decimalPlaces)
    .split("")
    .every((char) => char === "0");
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
