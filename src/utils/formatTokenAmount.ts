import {DefaultLocale} from "./constants";

export function formatTokenAmount(
  value: number | string,
  options: {
    maxDecimals?: number;
    minDecimals?: number;
    thresholdForSmallValues?: number;
  } = {},
): string {
  const {
    maxDecimals = 5,
    minDecimals = 2,
    thresholdForSmallValues = 0.00001,
  } = options;

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) return "0";
  if (numericValue === 0) return "0";

  // Handle very small amounts (combining both functions' approaches)
  if (Math.abs(numericValue) < thresholdForSmallValues) {
    return `<${thresholdForSmallValues}`;
  }

  // Handle amounts that would show as 0.00001-0.0001
  if (Math.abs(numericValue) < 0.0001) {
    return numericValue.toLocaleString(DefaultLocale, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  }

  // Handle large amounts
  if (Math.abs(numericValue) >= 1000) {
    return new Intl.NumberFormat(DefaultLocale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      notation: "compact",
    }).format(numericValue);
  }

  // Calculate optimal decimal places for medium amounts
  const log10 = Math.log10(Math.abs(numericValue));
  const decimals = Math.max(
    minDecimals,
    Math.min(maxDecimals, Math.floor(4 - log10)),
  );

  // Format with optimal decimal places
  return new Intl.NumberFormat(DefaultLocale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: Math.min(decimals, minDecimals),
  }).format(numericValue);
}
