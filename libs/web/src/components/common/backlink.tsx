import { ChevronLeft } from "@/meshwave-ui/icons";
import Link from "next/link";
import { clsx } from "clsx";

export function BackLink({
  href,
  title,
  className,
}: {
  href?: string;
  title?: string;
  className?: string;
}){
  const hrefToUse = href || "/";
  const titleToUse = title || "Back";

  return (
    <Link href={hrefToUse} className={clsx("flex items-center gap-2 text-[16px] leading-[22px] text-[var(--content-grey)] hover:text-[var(--content-primary)]", className)}>
      <ChevronLeft />
      {titleToUse}
    </Link>
  );
};
