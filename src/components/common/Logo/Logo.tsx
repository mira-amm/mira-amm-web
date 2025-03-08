import {memo} from "react";
import Link from "next/link";

import styles from "./Logo.module.css";
import LogoIcon from "@/src/components/icons/Logo/LogoIcon";
import LogoIconFooter from "@/src/components/icons/Logo/LogoIconFooter";

type LogoProps = {
  isFooter?: boolean; // If true, use LogoIconFooter; otherwise, use LogoIcon
};

const Logo = ({isFooter = false}: LogoProps) => {
  return (
    <Link href="/" className={styles.logo}>
      {isFooter ? <LogoIconFooter /> : <LogoIcon />}
    </Link>
  );
};

export default memo(Logo);
