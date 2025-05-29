import styles from "./loader.module.css";
import {clsx} from "clsx";

export function Loader({variant, color}: {
  variant?: "primary" | "secondary" | "outlined";
  color?: "gray"; //Add more color options if required
}){
  return (
    <div
      className={clsx(
        styles.loader,
        variant === "outlined" && styles.outlined,
        color && styles[`${color}`],
      )}
    />
  );
};
