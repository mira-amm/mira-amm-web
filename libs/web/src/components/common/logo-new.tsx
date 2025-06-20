import Link from "next/link";
import LogoIconFooter from "./Logo/LogoIconFooter";
import LogoIcon from "./Logo/LogoIcon";
import {cn} from "@/src/utils/cn";

type Props = {
  isFooter?: boolean;
};

export function LogoNew({isFooter = false}: Props) {
  return (
    <Link href="/" className={cn(!isFooter && "w-[150px]")}>
      {isFooter ? <LogoIconFooter /> : <LogoIcon />}
    </Link>
  );
}
