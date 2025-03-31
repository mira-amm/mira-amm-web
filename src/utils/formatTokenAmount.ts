import {DefaultLocale} from "./constants";

/**
 * Formats token amounts with appropriate decimal places:
 * - Very small amounts (<0.0001): Show 4 decimal places with scientific notation if needed
 * - Medium amounts: Show 2-5 decimal places based on value
 * - Large amounts (>1000): Show 2 decimal places with compact notation
 */
export function formatTokenAmount(
  value: number | string,
  maxDecimals: number = 5,
  minDecimals: number = 2,
): string {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) return "0";
  if (numericValue === 0) return "0";

  // Handle very small amounts
  if (Math.abs(numericValue) < 0.0001) {
    return numericValue.toExponential(4).replace("e", "e+");
  }

  // Handle large amounts
  if (Math.abs(numericValue) >= 1000) {
    return new Intl.NumberFormat(DefaultLocale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      notation: "compact",
    }).format(numericValue);
  }

  // Calculate optimal decimal places
  const log10 = Math.log10(Math.abs(numericValue));
  const decimals = Math.max(
    minDecimals,
    Math.min(maxDecimals, Math.floor(4 - log10)),
  );

  // Format with optimal decimal places
  return new Intl.NumberFormat(DefaultLocale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: Math.min(decimals, 2),
  }).format(numericValue);
}
