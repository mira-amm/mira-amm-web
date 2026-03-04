import {useAssetMetadata} from "@/src/hooks";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {ChevronDown} from "lucide-react";
import {cn} from "@/src/utils/cn";
import Image from "next/image";

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
        "flex items-center gap-2 text-content-primary dark:text-content-primary hover:bg-background-grey-light",
        newPool &&
          "rounded px-2 py-1 cursor-pointer hover:background-grey-light"
      )}
      onClick={handleClick}
    >
      {icon && (
        <Image
          src={icon}
          width={20}
          height={20}
          className="size-5"
          alt={metadata.symbol + " icon"}
        />
      )}
      <p className={cn("text-base  leading-[19px]", className)}>
        {metadata.symbol ?? "Choose Asset"}
      </p>
      {newPool && <ChevronDown />}
    </div>
  );
}
