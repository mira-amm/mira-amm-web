import styles from "./Divider.module.css";
import {DividerProps} from "./DividerProps";

export const Divider: React.FC<DividerProps> = ({children, className}) => {
  return <ul className={className}>{children}</ul>;
};
