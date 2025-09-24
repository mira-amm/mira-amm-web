import Link from "next/link";
import LogoIconFooter from "./Logo/LogoIconFooter";
import LogoIcon from "./Logo/LogoIcon";
import {cn} from "@/src/utils/cn";

export function Logo({isFooter = false}: {isFooter?: boolean}) {
  return (
    <Link
      href="/"
      aria-label="Microchain home"
      className={cn(!isFooter && "w-[150px]", "dark:text-white")}
    >
      {isFooter ? <LogoIconFooter /> : <LogoIcon />}
    </Link>
  );
}
