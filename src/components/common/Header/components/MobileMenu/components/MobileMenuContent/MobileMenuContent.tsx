import {memo} from "react";

import Logo from "@/src/components/common/Logo/Logo";
import styles from './MobileMenuContent.module.css';
import {createPortal} from "react-dom";
import {useIsClient} from "usehooks-ts";
import {clsx} from "clsx";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import Link from "next/link";
import SoonLabel from "@/src/components/common/SoonLabel/SoonLabel";
import {DiscordLink, XLink} from "@/src/utils/constants";

type Props = {
  expanded: boolean;
  toggleExpandedState: () => void;
}

const MobileMenuContent = ({ expanded, toggleExpandedState }: Props) => {
  const isBrowser = useIsClient();

  if (!isBrowser) {
    return null;
  }

  return createPortal(
    <div className={clsx(styles.mobileMenu, expanded && styles.mobileMenuActive)}>
      <div className={styles.heading}>
        <Logo />
        <button className={styles.closeButton} onClick={toggleExpandedState}>
          <CloseIcon />
        </button>
      </div>
      <nav className={styles.links}>
        <Link href='/swap'>Swap</Link>
        <a href="#" className={styles.linkWithLabel}>
          Liqudity
          <SoonLabel />
        </a>
        {/*<a href="#">Docs</a>*/}
        <Link href='/faucet'>Faucet</Link>
        <a href="#">Testnet</a>
        {/*<a href="#">Github</a>*/}
        <a href={DiscordLink}>Discord</a>
        <a href={XLink}>X</a>
      </nav>
    </div>,
    document.body
  );
};

export default memo(MobileMenuContent);
