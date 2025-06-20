import React, {useCallback} from "react";
import {IconButton} from "@/src/components/common";
import {LogoIcon} from "@/meshwave-ui/icons";
import {PoolId, getLPAssetId} from "mira-dex-ts";
import usePositionData from "@/src/hooks/usePositionData";
import {formatUnits} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {useFormattedAddress} from "@/src/hooks";
import {Copy} from "lucide-react";

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
    <div className="flex flex-1 flex-col justify-end rounded-2xl bg-gradient-to-r from-[#5872fc] via-[#6142ba] to-[#c41cff] p-4">
      <div className="mb-3 h-8 w-16">
        <LogoIcon />
      </div>
      <p className="text-base">{lpTokenDisplayValue} LP tokens</p>
      <p className="text-base flex justify-between items-center">
        Asset ID: {formattedLpTokenAssetId}
        <IconButton onClick={handleCopy}>
          <Copy className="w-4 h-4" />
        </IconButton>
      </p>
    </div>
  );
};

export default MiraBlock;
