import { ChevronLeft } from "@/src/components/icons";
import Link from "next/link";
import { isMobile } from "react-device-detect";
import { clsx } from "clsx";

export default function BackLink({
  href,
  showOnDesktop,
  title,
  onClick,
  className,
  chevron,
}: {
  href?: string;
  showOnDesktop?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
  chevron?: boolean;
}){
  if (!isMobile && !showOnDesktop) {
    return null;
  }

  const hrefToUse = href || "/";
  const titleToUse = title || "Back";

  const baseClasses =
    "flex items-center gap-2 text-[16px] leading-[22px] text-[var(--content-grey)] hover:text-[var(--content-primary)]";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={clsx(baseClasses, "bg-none border-none p-0 cursor-pointer", className)}
      >
        <ChevronLeft />
        {titleToUse}
      </button>
    );
  }

  return (
    <Link href={hrefToUse} className={clsx(baseClasses, className)}>
      {chevron && <ChevronLeft />}
      {titleToUse}
    </Link>
  );
};
