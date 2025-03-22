import styles from "./StepsBlock.module.css";
import {InfoBlockProps} from "@/src/ts-interfaces/InfoBlockProps";

export const StepsBlock: React.FC<InfoBlockProps> = ({
  logo,
  title,
  description,
}) => {
  return (
    <div className={styles.stepsBlock}>
      {logo}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
};
