import styles from "./PositionLabel.module.css";
import {clsx} from "clsx";

type Props = {
  status?: "active" | "inactive";
  className?: string;
};

const PositionLabel = ({status, className}: Props) => {
  return <p className={clsx(styles.positionLabel, className)}>Active</p>;
};

export default PositionLabel;
