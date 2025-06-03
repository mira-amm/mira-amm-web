import Link from "next/link";
import {LogoIcon} from "@/meshwave-ui/icons";

export function Logo() {
  return (
    <Link
      href="/"
      className="w-16 h-8 flex flex-col justify-center text-content-primary hover:text-content-primary"
    >
      <LogoIcon />
    </Link>
  );
}
