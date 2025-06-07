import { B256Address } from "fuels";
import { useAssetImage } from "@/src/hooks/useAssetImage";
import { useAssetMetadata } from "@/src/hooks";

export function CoinWithAmount({
  amount,
  assetId,
  withName,
}: {
  amount: string;
  assetId: B256Address;
  withName?: boolean;
}) {
  const icon = useAssetImage(assetId);
  const metadata = useAssetMetadata(assetId);

  return (
    <div className="flex items-center gap-2 flex-1">
      {icon && (
        <img
          src={icon}
          alt={`${metadata.symbol} icon`}
          className="w-[38px] h-[38px]"
        />
      )}
      {!withName ? (
        <div className="flex flex-col gap-1">
          <p className="font-medium text-[18px] leading-[22px] text-content-primary">
            {amount}
          </p>
          <p className="font-normal text-[15px] leading-[18px] text-content-dimmed-light">
            {metadata.symbol}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="font-medium text-[18px] leading-[22px] text-content-primary">
            {metadata.symbol}
          </p>
          <p className="font-normal text-[15px] leading-[18px] text-content-dimmed-light">
            {metadata.name}
          </p>
        </div>
      )}
    </div>
  );
}
