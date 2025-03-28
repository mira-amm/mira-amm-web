import styles from "./RoadMapIcon.module.css";
import {RoadMapIconProps} from "@/src/ts-interfaces/RoadMapIconProps";

export const RoadMapIcon: React.FC<RoadMapIconProps> = ({text}) => {
  return (
    <div className={styles.background}>
      <span className={styles.text}>{text}</span>
    </div>
  );
};
