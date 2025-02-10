import styles from "./Skeleton.module.css";
import clsx from "clsx";

const Skeleton = ({className}: {className?: string}): JSX.Element => {
  return <div className={clsx(styles.skeleton, className)} />;
};

export default Skeleton;
