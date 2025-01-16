import {ReactNode} from "react";

import styles from "./PromoBlock.module.css";

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
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{linkText}</p>
      </div>
    </a>
  );
};

export default PromoBlock;
