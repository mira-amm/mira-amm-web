import { CoinQuantity } from "fuels";
import { SkeletonLoader, CoinListItem } from "@/web/src/components/common";
import { useAsset } from "@/src/hooks";

export function UnknownCoinListItem({
  assetId,
  balance,
  onClick,
}: {
  assetId: string;
  balance?: CoinQuantity;
  onClick: () => void;
}) {
  const { asset: metadata, isLoading } = useAsset(assetId);

  if (isLoading) return <SkeletonLoader isLoading count={1} textLines={1} />;
  if (!metadata) return <div className="px-4 py-2">Asset not found</div>;

  return (
    <div
      onClick={onClick}
      className="px-4 py-2 rounded-lg hover:bg-background-grey-dark cursor-pointer"
    >
      <CoinListItem
        assetData={{ ...metadata, userBalance: balance, isVerified: false }}
      />
    </div>
  );
}
