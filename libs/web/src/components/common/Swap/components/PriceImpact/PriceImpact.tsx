import {FC, memo} from "react";
import styles from "./PriceImpact.module.css";
import {clsx} from "clsx";

interface PriceImpactProps {
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}

const getPriceImpact = (
  reservesPrice: number | undefined,
  previewPrice: number | undefined,
) => {
  if (
    reservesPrice === undefined ||
    previewPrice === undefined ||
    reservesPrice === 0
  ) {
    return -1;
  }
  if (reservesPrice <= previewPrice) {
    return 0;
  }
  const impact = ((reservesPrice - previewPrice) / reservesPrice) * 100;
  return Math.min(impact, 99.99);
};

const PriceImpact: FC<PriceImpactProps> = ({reservesPrice, previewPrice}) => {
  const priceImpactValue = getPriceImpact(reservesPrice, previewPrice);

  const highPriceImpact = priceImpactValue > 5;
  const mediumPriceImpact = priceImpactValue > 2 && priceImpactValue <= 5;
  const priceImpactHidden = priceImpactValue === -1;

  return (
    <div
      className={clsx(
        styles.priceImpact,
        highPriceImpact && styles.redText,
        mediumPriceImpact && styles.yellowText,
        priceImpactHidden && styles.hidden,
      )}
    >
      <div className={styles.priceImpactEntry}>
        <p>Price impact:</p>
        <p>{priceImpactValue.toFixed(2)}%</p>
      </div>
      {(highPriceImpact || mediumPriceImpact) && (
        <p>{`WARNING: ${highPriceImpact ? "Large" : "Medium"} Price impact detected`}</p>
      )}
    </div>
  );
};

export default memo(PriceImpact);
