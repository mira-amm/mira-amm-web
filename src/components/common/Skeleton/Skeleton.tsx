import styles from "./Skeleton.module.css";
import clsx from "clsx";

const Skeleton = ({className}: {className?: string}) => {
  return <div className={clsx(styles.skeleton, className)} />;
};

export default Skeleton;
