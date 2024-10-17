import styles from './AddLiquidity.module.css';
import {useCallback, useState} from "react";
import PreviewAddLiquidityDialog, {AddLiquidityPreviewData} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import BackLink from "@/src/components/common/BackLink/BackLink";
import {useRouter} from "next/navigation";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import {PoolId} from "mira-dex-ts";

type Props = {
  poolId: PoolId;
}

const AddLiquidity = ({ poolId }: Props) => {
  const router = useRouter();

  const [previewData, setPreviewData] = useState<AddLiquidityPreviewData | null>(null);

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push('/liquidity');
  }, [router]);

  const showPreview = Boolean(previewData);

  return (
    <>
      <BackLink showOnDesktop onClick={handleBackClick} className={styles.backLink} />
      <section className={styles.addLiquidity}>
        <div className={styles.addLiquidityHeading}>
          <p className={styles.title}>
            Add Liquidity
          </p>
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
        {showPreview ? (
          <PreviewAddLiquidityDialog previewData={previewData!} setPreviewData={setPreviewData} />
        ) : (
          <AddLiquidityDialog poolId={poolId} setPreviewData={setPreviewData} />
        )}
      </section>
      {showPreview && (
        <div className={styles.loadingOverlay}/>
      )}
    </>
  );
};

export default AddLiquidity;
