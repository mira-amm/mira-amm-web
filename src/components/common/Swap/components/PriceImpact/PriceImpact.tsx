import {FC, memo, useMemo} from "react";
import styles from "./PriceImpact.module.css";
import {clsx} from "clsx";

interface PriceImpactProps {
  reservedPrice: number | null;
  previewPrice: number | null;
}

const PriceImpact: FC<PriceImpactProps> = ({
  reservedPrice,
  previewPrice,
}) => {
  const priceImpactValue = reservedPrice !== null && previewPrice !== null ?
    Math.abs(((previewPrice - reservedPrice) / reservedPrice) * 100) :
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
