import {ReactNode} from "react";

import styles from './PromoBlock.module.css';

type Props = {
  icon: ReactNode;
  title: string;
  link: string;
  linkText: string;
};

const PromoBlock = ({ icon, title, link, linkText }: Props) => {
  return (
    <div className={styles.promoBlock}>
      <div className={styles.icon}>
        {icon}
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <a href={link} className={styles.text} target="_blank">{linkText}</a>
      </div>
    </div>
  );
};

export default PromoBlock;
