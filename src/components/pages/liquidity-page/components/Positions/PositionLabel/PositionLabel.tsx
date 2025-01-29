import styles from "./PositionLabel.module.css";
import {clsx} from "clsx";

type Props = {
  className?: string;
};

const PositionLabel = ({className}: Props): JSX.Element => {
  return <p className={clsx(styles.positionLabel, className)}>Active</p>;
};

export default PositionLabel;
