import styles from "./StepsIcon.module.css";
import {StepsIconProps} from "@/src/ts-interfaces/StepsIconProps";

export const StepsIcon: React.FC<StepsIconProps> = ({icon}) => {
  return <div className={styles.iconBackground}>{icon}</div>;
};
