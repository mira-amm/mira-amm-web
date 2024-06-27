import {memo} from "react";
import Link from "next/link";

import styles from './Logo.module.css';

const Logo = () => {
  return (
    <Link href="/" className={styles.logo}>Mira</Link>
  );
};

export default memo(Logo);
