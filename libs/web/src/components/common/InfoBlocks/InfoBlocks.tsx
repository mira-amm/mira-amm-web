import styles from "./InfoBlocks.module.css";
import {InfoBlocksProps} from "../../../ts-interfaces/InfoBlocksProps";
import clsx from "clsx";

export const InfoBlocks: React.FC<InfoBlocksProps> = ({title, children}) => {
  return (
    <>
      <h3 className={clsx(styles.title, "mc-type-xxxl")}>{title}</h3>
      <ul className={styles.blocksList}>{children}</ul>
    </>
  );
};
