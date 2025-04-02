import styles from "./LoadingIndicator.module.css";
import clsx from "clsx";

type ButtonProps = {
  fontSize?: string;
};

const LoadingIndicator = ({
  fontSize = "mc-type-xxl",
}: ButtonProps): JSX.Element => {
  return <span className={clsx(styles.loadingAnimation, `${fontSize}`)} />;
};

export default LoadingIndicator;
