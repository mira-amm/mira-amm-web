import Link from "next/link";
import {LogoIcon} from "@/meshwave-ui/icons";
import {FeatureGuard} from "./feature-guard";
import {LogoNew} from "./logo-new";

export function Logo({isFooter = false}: {isFooter?: boolean}) {
  return (
    <FeatureGuard
      fallback={
        <Link
          href="/"
          className="w-16 h-8 flex flex-col justify-center text-content-primary hover:text-content-primary"
        >
          <LogoIcon />
        </Link>
      }
    >
      <LogoNew isFooter={isFooter} />
    </FeatureGuard>
  );
}
