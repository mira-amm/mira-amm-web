import {clsx} from "clsx";
import {useAssetMetadata} from "@/src/hooks";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {ChevronDown} from "lucide-react";
import {cn} from "@/src/utils/cn";

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

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-content-primary dark:text-content-primary",
        newPool &&
          "rounded px-2 py-1 cursor-pointer hover:background-grey-light active:bg-background-grey-dark"
      )}
      onClick={handleClick}
    >
      {icon && <img src={icon} className="size-5" />}
      <p className={cn("text-[18px] font-medium leading-[19px]", className)}>
        {metadata.symbol ?? "Choose Asset"}
      </p>
      {newPool && <ChevronDown />}
    </div>
  );
}
