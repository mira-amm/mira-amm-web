import styles from "./Skeleton.module.css";
import clsx from "clsx";

const Skeleton = ({className}: {className?: string}): JSX.Element => {
  return (
    <div className={clsx(styles.skeleton, className)}>
      <div className={clsx(styles.circle, styles.items)} />
      <div className={styles.textContainer}>
        <div className={clsx(styles.textLine, styles.items)} />
        <div
          className={clsx(styles.textLine, styles.subTextLine, styles.items)}
        />
      </div>
      <div className={clsx(styles.endBlock, styles.items)} />
    </div>
  );
};

export default Skeleton;
