import {ReactNode} from "react";

import styles from './PromoBlock.module.css';

type Props = {
  icon: ReactNode;
  title: string;
  text: string;
};

const PromoBlock = ({ icon, title, text }: Props) => {
  return (
    <div className={styles.promoBlock}>
      <div className={styles.icon}>
        {icon}
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
};

export default PromoBlock;
