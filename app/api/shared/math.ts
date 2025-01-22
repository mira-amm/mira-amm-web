import {bn, DateTime} from "fuels";

// Helper function to decimalize an amount
export function decimalize(
  amount: string | number,
  assetDecimals: number,
): string {
  amount = parseFloat(amount.toString()) / 10 ** assetDecimals;
  const units = bn.parseUnits(amount.toString());
  let decimalizedVal = units.formatUnits();
  return decimalizedVal;
}

// Helper function to convert TAI64 String to datetime
export function convertTAI64StringToUnixSeconds(tai64String: string) {
  return DateTime.fromTai64(tai64String);
}

// Helper function to convert Unix Millseconds to Unix Seconds
export function convertUnixMillisecondsToUnixSeconds(
  nsTimestamp: number,
): number {
  return Math.floor(nsTimestamp / 1000);
}
