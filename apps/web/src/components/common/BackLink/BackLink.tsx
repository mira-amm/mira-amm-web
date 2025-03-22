import ChevronLeft from "@/src/components/icons/ChevronLeft/ChevronLeft";
import Link from "next/link";

import styles from "./BackLink.module.css";
import {isMobile} from "react-device-detect";
import {clsx} from "clsx";

type Props = {
  href?: string;
  showOnDesktop?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
  chevron?: boolean;
};

const BackLink = ({
  href,
  showOnDesktop,
  title,
  onClick,
  className,
  chevron,
}: Props) => {
  if (!isMobile && !showOnDesktop) {
    return null;
  }

  const hrefToUse = href || "/";
  const titleToUse = title || "Back";

  if (onClick) {
    return (
      <button onClick={onClick} className={clsx(styles.backLink, className)}>
        <ChevronLeft />
        {titleToUse}
      </button>
    );
  }

  return (
    <Link href={hrefToUse} className={clsx(styles.backLink, className)}>
      {chevron && <ChevronLeft />}
      {titleToUse}
    </Link>
  );
};

export default BackLink;
