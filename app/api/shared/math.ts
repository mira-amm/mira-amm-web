// Helper function to decimalize an amount
function decimalize(amount: string | number, assetDecimals: number): number {
  return parseFloat(amount.toString()) / 10 ** assetDecimals;
}
