import Link from "next/link";
import { LogoIcon } from "@/meshwave-ui/icons";

export function Logo(){
  return (
    <Link
      href="/"
      className="w-16 h-8 flex flex-col justify-center text-[var(--content-primary)] hover:text-[var(--content-primary)]"
    >
      <LogoIcon />
    </Link>
  );
};
