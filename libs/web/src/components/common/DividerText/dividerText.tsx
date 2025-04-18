import styles from "./dividerText.module.css";
import {DividerTextProps} from "./DividerTextProps";
import {clsx} from "clsx";

export const DividerText: React.FC<DividerTextProps> = ({text, dimmed}) => {
  return (
    <li className={clsx(styles.dividerText, dimmed && styles.dimmed)}>
      {text}
    </li>
  );
};
