import { clsx } from "clsx";
import { ChevronDownIcon } from "@/meshwave-ui/icons";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import { useAssetImage } from "@/src/hooks/useAssetImage";

export function Coin({ assetId, className, onClick }: {
  assetId: string | null;
  className?: string;
  onClick?: VoidFunction;
}){
  const metadata = useAssetMetadata(assetId);
  const icon = useAssetImage(assetId);

  const handleClick = () => {
    if (onClick) onClick();
  };

  const newPool = Boolean(onClick);

  const baseClasses = "flex items-center gap-2 text-[var(--content-primary)]";
  const clickableClasses =
    "rounded px-2 py-1 cursor-pointer hover:bg-[var(--background-grey-light)] active:bg-[var(--background-grey-dark)]";
  const nameClasses = "text-[18px] font-medium leading-[19px]";

  return (
    <div
      className={clsx(baseClasses, newPool && clickableClasses)}
      onClick={handleClick}
    >
      {icon && <img src={icon} alt={`${metadata.symbol} icon`} />}
      <p className={clsx(nameClasses, className)}>
        {metadata.symbol ?? "Choose Asset"}
      </p>
      {newPool && <ChevronDownIcon />}
    </div>
  );
};
