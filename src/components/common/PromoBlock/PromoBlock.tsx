import {ReactNode} from "react";

import styles from "./PromoBlock.module.css";
import clsx from "clsx";

type Props = {
  icon: ReactNode;
  title: string;
  link: string;
  linkText: string;
};

const PromoBlock = ({icon, title, link, linkText}: Props) => {
  return (
    <a href={link} className={styles.promoBlock} target="_blank">
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <p className={clsx(styles.title, "mc-type-m")}>{title}</p>
        <p className={clsx(styles.text, "mc-type-m")}>{linkText}</p>
      </div>
    </a>
  );
};

export default PromoBlock;
