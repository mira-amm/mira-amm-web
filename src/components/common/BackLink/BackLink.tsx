import {clsx} from "clsx";
import ChevronLeft from "@/src/components/icons/ChevronLeft/ChevronLeft";
import Link from "next/link";

import styles from './BackLink.module.css';

const BackLink = () => {
  return (
    <Link href="/" className={clsx('mobileOnly', styles.backLink)}>
      <ChevronLeft />
      Back
    </Link>
  );
};

export default BackLink;
