import {memo, ReactNode} from "react";

import styles from "./TextButton.module.css";

type Props = {
  children: ReactNode;
  onClick: VoidFunction;
  isDisabled?: boolean;
};

const TextButton = ({children, onClick, isDisabled}: Props) => {
  return (
    <button
      disabled={isDisabled}
      className={styles.textButton}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default memo(TextButton);
