import {memo} from "react";

import Logo from "@/src/components/common/Logo/Logo";
import styles from "./MobileMenuContent.module.css";
import {createPortal} from "react-dom";
import {useIsClient} from "usehooks-ts";
import {clsx} from "clsx";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import Link from "next/link";
import SoonLabel from "@/src/components/common/SoonLabel/SoonLabel";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import useFaucetLink from "@/src/hooks/useFaucetLink";

type Props = {
  expanded: boolean;
  toggleExpandedState: () => void;
};

const MobileMenuContent = ({expanded, toggleExpandedState}: Props) => {
  const isBrowser = useIsClient();

  const faucetLink = useFaucetLink();

  if (!isBrowser) {
    return null;
  }

  return createPortal(
    <div
      className={clsx(styles.mobileMenu, expanded && styles.mobileMenuActive)}
    >
      <div className={styles.heading}>
        <Logo />
        <button className={styles.closeButton} onClick={toggleExpandedState}>
          <CloseIcon />
        </button>
      </div>
      <nav className={styles.links}>
        <Link href="/swap">Swap</Link>
        <Link href="/liquidity">Liquidity</Link>
        <a href={faucetLink} target="_blank">
          Faucet
        </a>
        {/*<a href="#">Github</a>*/}
        <a href={DiscordLink} target="_blank">
          Discord
        </a>
        <a href={XLink} target="_blank">
          X
        </a>
        <a href="https://docs.mira.ly">Docs</a>
        <a href={BlogLink} target="_blank">
          Blog
        </a>
      </nav>
    </div>,
    document.body,
  );
};

export default memo(MobileMenuContent);
