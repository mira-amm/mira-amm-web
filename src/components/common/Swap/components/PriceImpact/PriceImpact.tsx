import { FC, useMemo } from "react";
import styles from "./PriceImpact.module.css";

interface PriceImpactProps {
  calculatedPrice: number;
  previewPrice: number;
}

export const PriceImpact: FC<PriceImpactProps> = ({
  calculatedPrice,
  previewPrice,
}) => {
  const slippage = useMemo(() => {
    if (calculatedPrice === 0 || previewPrice === 0) return 0;
    return ((previewPrice - calculatedPrice) / calculatedPrice) * 100;
  }, [calculatedPrice, previewPrice]);

  return (
    <div>
      <p className={styles.priceImpact}>Price impact: {slippage.toFixed(2)}%</p>
    </div>
  );
};

export default PriceImpact;
