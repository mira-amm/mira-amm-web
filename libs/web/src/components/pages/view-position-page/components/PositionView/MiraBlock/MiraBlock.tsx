import React, {useCallback} from "react";
import IconButton from "@/src/components/common/IconButton/IconButton";
import styles from "./MiraBlock.module.css";
import {CopyIcon, LogoIcon} from "@/meshwave-ui/icons";
import {PoolId, getLPAssetId} from "mira-dex-ts";
import usePositionData from "@/src/hooks/usePositionData";
import {formatUnits} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";

interface MiraBlockProps {
  pool: PoolId;
}

const MiraBlock = ({pool}: MiraBlockProps) => {
  const {lpTokenBalance} = usePositionData({pool});
  const lpTokenDisplayValue = formatUnits(lpTokenBalance || "0", 9);
  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
  }, [lpTokenAssetId.bits]);

  return (
    <div className={styles.miraBlock}>
      <div className={styles.miraLogo}>
        <LogoIcon />
      </div>
      <p className={styles.tokenDisplayValue}>
        {lpTokenDisplayValue} LP tokens
      </p>
      <p className={styles.numberAndCopy}>
        Asset ID: {formattedLpTokenAssetId}
        <IconButton onClick={handleCopy}>
          <CopyIcon />
        </IconButton>
      </p>
    </div>
  );
};

export default MiraBlock;
