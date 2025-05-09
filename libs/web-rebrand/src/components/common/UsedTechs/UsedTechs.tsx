import React from "react";
import styles from "./UsedTechs.module.css";
import {UsedTechsProps} from "./UsedTechsProps";
import {clsx} from "clsx";

export const UsedTechs: React.FC<UsedTechsProps> = ({
  text,
  children,
  className,
}) => {
  return (
    <figure className={clsx(styles.usedTechs, className)}>
      <figcaption className={styles.text}>{text}</figcaption>
      {children}
    </figure>
  );
};
