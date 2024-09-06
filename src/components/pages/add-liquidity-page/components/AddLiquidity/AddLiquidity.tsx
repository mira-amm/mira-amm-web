import styles from './AddLiquidity.module.css';
import {getCoinsFromKey} from "@/src/utils/common";
import {useCallback, useState} from "react";
import PreviewAddLiquidityDialog
  from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import BackLink from "@/src/components/common/BackLink/BackLink";
import {useRouter} from "next/navigation";

type Props = {
  poolKey: string;
}

const AddLiquidity = ({ poolKey }: Props) => {
  const router = useRouter();

  const [previewData, setPreviewData] = useState(null);

  const { coinA, coinB } = getCoinsFromKey(poolKey);

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  return (
    <>
      <BackLink showOnDesktop onClick={handleBackClick} className={styles.backLink} />
      <section className={styles.addLiquidity}>
        <p className={styles.title}>
          Add Liquidity
        </p>
        {previewData ? (
          <PreviewAddLiquidityDialog previewData={previewData} />
        ) : (
          <AddLiquidityDialog firstCoin={coinA} secondCoin={coinB} setPreviewData={setPreviewData} />
        )}
      </section>
      {previewData && <div className={styles.loadingOverlay}/>}
    </>
  );
};

export default AddLiquidity;
