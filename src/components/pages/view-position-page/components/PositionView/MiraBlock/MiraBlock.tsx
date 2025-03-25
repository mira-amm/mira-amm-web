import React, {useCallback} from "react";
import IconButton from "@/src/components/common/IconButton/IconButton";
import styles from "./MiraBlock.module.css";
import {CopyIcon} from "@/src/components/icons/Copy/CopyIcon";
import {PoolId, getLPAssetId} from "mira-dex-ts";
import usePositionData from "@/src/hooks/usePositionData";
import {formatUnits} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import clsx from "clsx";
import MiraTextLogo from "@/src/components/icons/Logo/MiraTextLogo";

interface MiraBlockProps {
  pool: PoolId;
  setIsAddressCopied?: React.Dispatch<React.SetStateAction<boolean>>;
}

const MiraBlock = ({pool, setIsAddressCopied}: MiraBlockProps): JSX.Element => {
  const {lpTokenBalance} = usePositionData({pool});
  const lpTokenDisplayValue = formatUnits(lpTokenBalance || "0", 9);
  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
    if (setIsAddressCopied) {
      setIsAddressCopied(true);
      setTimeout(() => {
        setIsAddressCopied(false);
      }, 3000);
    }
  }, [lpTokenAssetId.bits]);

  return (
    <>
      <div className={styles.miraBlock}>
        <div className={styles.miraLogo}>
          <MiraTextLogo />
        </div>
        <p className={clsx(styles.tokenDisplayValue, styles.infoText)}>
          {lpTokenDisplayValue} LP tokens
        </p>
        <p className={clsx(styles.numberAndCopy, styles.infoText)}>
          Asset ID: {formattedLpTokenAssetId}
          <IconButton onClick={handleCopy}>
            <CopyIcon />
          </IconButton>
        </p>
      </div>
    </>
  );
};

export default MiraBlock;
