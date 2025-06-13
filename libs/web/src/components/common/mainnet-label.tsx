import { clsx } from "clsx";
import { FuelIcon } from "@/meshwave-ui/icons";

export function MainnetLabel({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-[14px] py-[7px] rounded-[20px] cursor-default font-normal",
        className
      )}
    >
      <FuelIcon />
      Mainnet
    </div>
  );
}
