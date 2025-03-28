import {MainInfoProps} from "../../../ts-interfaces/MainInfoProps";
import styles from "./MainInfo.module.css";

export const MainInfo: React.FC<MainInfoProps> = ({
  title,
  description,
  children,
  link,
}) => {
  return (
    <>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>
        {description}
        <a className={styles.link} href="/">
          {link}
        </a>
      </p>
      {children}
    </>
  );
};
