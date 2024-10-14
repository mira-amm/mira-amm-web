import {FC, memo, useMemo} from "react";
import styles from "./PriceImpact.module.css";
import {clsx} from "clsx";

interface PriceImpactProps {
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}

const PriceImpact: FC<PriceImpactProps> = ({
  reservesPrice,
  previewPrice,
}) => {
  const priceImpactValue = reservesPrice !== undefined && previewPrice !== undefined ?
    Math.abs(((previewPrice - reservesPrice) / reservesPrice) * 100) :
    -1;

  const highPriceImpact = priceImpactValue > 5;
  const mediumPriceImpact = priceImpactValue > 1 && priceImpactValue <= 5;
  const priceImpactHidden = priceImpactValue === -1;

  return (
    <p className={clsx(
      styles.priceImpact,
      highPriceImpact && styles.redText,
      mediumPriceImpact && styles.orangeText,
      priceImpactHidden && styles.hidden,
    )}>
      Price impact: {priceImpactValue.toFixed(2)}%
    </p>
  );
};

export default memo(PriceImpact);
