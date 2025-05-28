import { memo } from "react";
import { clsx } from "clsx";

const SoonLabel = ({ className }: {
  className?: string;
}) => {
  return (
    <span
      className={clsx(
        "px-2 py-[2px] rounded-[20px] font-medium text-[10px] leading-[14px] text-[var(--background-primary)] bg-[var(--accent-primary)] lowercase",
        className
      )}
    >
      Soon
    </span>
  );
};

export default memo(SoonLabel);
