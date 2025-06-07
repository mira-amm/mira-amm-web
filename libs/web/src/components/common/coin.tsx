import {clsx} from "clsx";
import {useAssetMetadata} from "@/src/hooks";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import { ChevronDown } from "lucide-react";

export function Coin({
  assetId,
  className,
  onClick,
}: {
  assetId: string | null;
  className?: string;
  onClick?: VoidFunction;
}) {
  const metadata = useAssetMetadata(assetId);
  const icon = useAssetImage(assetId);

  const handleClick = () => {
    if (onClick) onClick();
  };

  const newPool = Boolean(onClick);

  const baseClasses = "flex items-center gap-2 text-content-primary";
  const clickableClasses =
    "rounded px-2 py-1 cursor-pointer hover:background-grey-light active:bg-background-grey-dark";
  const nameClasses = "text-[18px] font-medium leading-[19px]";

  return (
    <div
      className={clsx(baseClasses, newPool && clickableClasses)}
      onClick={handleClick}
    >
      {icon && <img src={icon} alt={`${metadata.symbol} icon`} className="size-5" />}
      <p className={clsx(nameClasses, className)}>
        {metadata.symbol ?? "Choose Asset"}
      </p>
      {newPool && <ChevronDown />}
    </div>
  );
}
