import {memo} from "react";

import styles from "./SoonLabel.module.css";
import {clsx} from "clsx";

type Props = {
  className?: string;
};

const SoonLabel = ({className}: Props) => {
  return <span className={clsx(styles.soonLabel, className)}>Soon</span>;
};

export default memo(SoonLabel);
