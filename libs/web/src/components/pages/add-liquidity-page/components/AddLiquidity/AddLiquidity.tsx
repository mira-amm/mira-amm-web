import styles from "./AddLiquidity.module.css";
import {useCallback, useState} from "react";
import PreviewAddLiquidityDialog, {
  AddLiquidityPreviewData,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import BackLink from "@/src/components/common/BackLink/BackLink";
import {useRouter} from "next/navigation";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import {PoolId} from "mira-dex-ts";
import {SlippageSetting} from "@/src/components/common/SlippageSetting/SlippageSetting";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useModal from "@/src/hooks/useModal/useModal";
import {
  DefaultSlippageValue,
  SlippageMode,
} from "@/src/components/common/Swap/Swap";

type Props = {
  poolId: PoolId;
  poolKey: string;
};

const AddLiquidity = ({poolId, poolKey}: Props) => {
  const router = useRouter();
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();

  const [previewData, setPreviewData] =
    useState<AddLiquidityPreviewData | null>(null);
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const showPreview = Boolean(previewData);

  return (
    <>
      <BackLink
        showOnDesktop
        onClick={handleBackClick}
        className={styles.backLink}
      />
      <section className={styles.addLiquidity}>
        <div className={styles.addLiquidityHeading}>
          <p className={styles.title}>Add Liquidity</p>
          <SlippageSetting
            slippage={slippage}
            openSettingsModal={openSettingsModal}
          />
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
        {showPreview ? (
          <PreviewAddLiquidityDialog
            previewData={previewData!}
            setPreviewData={setPreviewData}
            slippage={slippage}
          />
        ) : (
          <AddLiquidityDialog
            poolId={poolId}
            setPreviewData={setPreviewData}
            poolKey={poolKey}
          />
        )}
      </section>
      {showPreview && <div className={styles.loadingOverlay} />}
      <SettingsModal title="Settings">
        <SettingsModalContent
          slippage={slippage}
          slippageMode={slippageMode}
          setSlippage={setSlippage}
          setSlippageMode={setSlippageMode}
          closeModal={closeSettingsModal}
        />
      </SettingsModal>
    </>
  );
};

export default AddLiquidity;
