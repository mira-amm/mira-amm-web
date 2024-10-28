import styles from "./SlippageWarning.module.css";

interface SlippageWarningProps {
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}

const SlippageWarning = ({
  reservesPrice,
  previewPrice,
}: SlippageWarningProps) => {
  if (reservesPrice === undefined || previewPrice === undefined || reservesPrice === 0) {
    return null;
  }

  if (reservesPrice <= previewPrice) {
    return null;
  }

  const impact = ((reservesPrice - previewPrice) / reservesPrice) * 100;

  if (impact > 5) {
    return (
      <div className={styles.box}>
        <div className={styles.warning}>Warning: High price impact ({impact.toFixed(1)}%)</div>
        <div className={styles.description}>Your swap price may be lower than expected</div>
      </div>
    );
  }

  return null;
};

export default SlippageWarning;

