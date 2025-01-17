// Helper function to decimalize an amount
export function decimalize(
  amount: string | number,
  assetDecimals: number,
): number {
  let decimalizedVal = parseFloat(amount.toString()) / 10 ** assetDecimals;
  return decimalizedVal;
}
