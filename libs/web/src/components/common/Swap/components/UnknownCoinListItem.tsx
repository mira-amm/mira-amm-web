import {CoinQuantity} from "fuels";
import {SkeletonLoader, CoinListItem} from "@/web/src/components/common";
import useAsset from "@/src/hooks/useAsset";

export function UnknownCoinListItem({
  assetId,
  balance,
  onClick,
}: {
  assetId: string;
  balance: CoinQuantity | undefined;
  onClick: () => void;
}) {
  const {asset: metadata, isLoading} = useAsset(assetId);

  const assetData = metadata && {
    ...metadata,
    userBalance: balance,
    isVerified: false, // setting is verified to false as the asset is imported by address
  };

  if (assetData) {
    return (
      <div
        onClick={onClick}
        className="px-4 py-2 rounded-lg hover:bg-background-grey-dark cursor-pointer"
      >
        <CoinListItem assetData={assetData} />
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader isLoading={true} count={1} textLines={1} />;
  }

  return <div className="px-4 py-2">Asset not found</div>;
}
