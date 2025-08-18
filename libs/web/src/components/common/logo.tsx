import {LogoNew} from "./logo-new";

export function Logo({isFooter = false}: {isFooter?: boolean}) {
  return <LogoNew isFooter={isFooter} />;
}
