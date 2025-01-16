import CheckboxIcon from "../../icons/Checkbox/CheckboxIcon";
import styles from "./RoadMapBlock.module.css";
import {InfoBlockProps} from "@/src/ts-interfaces/InfoBlockProps";

export const RoadMapBlock: React.FC<InfoBlockProps> = ({
  logo,
  title,
  description,
  done,
}) => {
  return (
    <div className={styles.roadMapBlock}>
      {logo}
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.checkboxArea}>
        {""}
        {done ? <CheckboxIcon /> : ""}
        <p className={done ? styles.done : styles.description}>{description}</p>
      </div>
    </div>
  );
};
