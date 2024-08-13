import ChevronLeft from "@/src/components/icons/ChevronLeft/ChevronLeft";
import Link from "next/link";

import styles from './BackLink.module.css';
import {isMobile} from "react-device-detect";

type Props = {
  href?: string;
  showOnDesktop?: boolean;
  title?: string;
};

const BackLink = ({ href, showOnDesktop, title }: Props) => {
  if (!isMobile && !showOnDesktop) {
    return null;
  }

  const hrefToUse = href || '/';
  const titleToUse = title || 'Back';

  return (
    <Link href={hrefToUse} className={styles.backLink}>
      <ChevronLeft />
      {titleToUse}
    </Link>
  );
};

export default BackLink;
