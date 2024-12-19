export const checkIfCoinVerified = ({
  symbol,
  assetId,
  verifiedAssetData,
}: {
  symbol?: string;
  assetId: string;
  verifiedAssetData: any;
}) => {
  const coin = verifiedAssetData?.find((i: any) => i.symbol === symbol);
  const verifiedAsset = coin?.networks?.find((i: any) => i.assetId === assetId);
  return !!verifiedAsset;
};
