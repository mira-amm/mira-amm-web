import {CoinQuantity} from "fuels";
import {SkeletonLoader, CoinListItem} from "@/web/src/components/common";
import {useAsset} from "@/src/hooks";

export function UnknownCoinListItem({
  assetId,
  balance,
  onClick,
}: {
  assetId: string;
  balance?: CoinQuantity;
  onClick: () => void;
}) {
  const {asset: metadata, isLoading} = useAsset(assetId);

  if (isLoading) return <SkeletonLoader isLoading count={1} textLines={1} />;

  // If metadata is not found, create a fallback with minimal info
  // This allows users to select unknown/mock tokens on testnet
  const assetData = metadata || {
    assetId,
    name: "Unknown Token",
    symbol: assetId.slice(0, 10) + "...",
    decimals: 9, // Default decimals for Fuel assets
    icon: undefined,
  };

  return (
    <div
      onClick={onClick}
      className="px-4 py-2 rounded-lg hover:bg-background-grey-dark cursor-pointer"
    >
      <CoinListItem
        assetData={{...assetData, userBalance: balance, isVerified: false}}
      />
    </div>
  );
}
