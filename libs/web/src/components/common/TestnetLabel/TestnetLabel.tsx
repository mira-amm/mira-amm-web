import {clsx} from "clsx";
import {memo} from "react";

import {FuelIcon} from "@/meshwave-ui/icons";

import styles from "./TestnetLabel.module.css";

type Props = {
  className?: string;
};

const TestnetLabel = ({className}: Props) => {
  return (
    <div className={clsx(styles.testnetLabel, className)}>
      <FuelIcon />
      Mainnet
    </div>
  );
};

export default memo(TestnetLabel);
