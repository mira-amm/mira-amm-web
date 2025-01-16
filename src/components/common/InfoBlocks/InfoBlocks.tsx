import styles from "./InfoBlocks.module.css";
import {InfoBlocksProps} from "../../../ts-interfaces/InfoBlocksProps";

export const InfoBlocks: React.FC<InfoBlocksProps> = ({title, children}) => {
  return (
    <>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.blocksList}>{children}</ul>
    </>
  );
};
