import { ChevronLeft } from "@/meshwave-ui/icons";
import Link from "next/link";
import { clsx } from "clsx";
import { MouseEventHandler } from "react";

export function BackLink({
  href,
  title,
  className,
  onClick
}: {
  href?: string;
  title?: string;
  className?: string;
  onClick?: MouseEventHandler
}){
  const hrefToUse = href || "/";
  const titleToUse = title || "Back";

  if (onClick) {
    return (
      <button onClick={onClick} className={clsx("flex items-center gap-2 text-[16px] leading-[22px] text-[var(--content-grey)] hover:text-[var(--content-primary)]", className)}>
        <ChevronLeft />
        {titleToUse}
      </button>
    );
  }

  return (
    <Link href={hrefToUse} className={clsx("flex items-center gap-2 text-[16px] leading-[22px] text-[var(--content-grey)] hover:text-[var(--content-primary)]", className)}>
      <ChevronLeft />
      {titleToUse}
    </Link>
  );
};
