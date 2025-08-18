import React, {useCallback} from "react";
import {IconButton, MicrochainTextLogo} from "@/src/components/common";
import {LogoIcon} from "@/meshwave-ui/icons";
import {PoolId, getLPAssetId} from "mira-dex-ts";
import {formatUnits} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {usePositionData, useFormattedAddress} from "@/src/hooks";
import {Copy} from "lucide-react";
import {cn} from "@/src/utils/cn";

export function MiraBlock({pool}: {pool: PoolId}) {
  const {lpTokenBalance} = usePositionData({pool});
  const lpTokenDisplayValue = formatUnits(lpTokenBalance || "0", 9);
  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const formattedLpTokenAssetId = useFormattedAddress(lpTokenAssetId.bits);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(lpTokenAssetId.bits);
  }, [lpTokenAssetId.bits]);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col justify-end rounded-ten p-4 bg-black"
      )}
    >
      <div className="mb-3 h-8 w-16">
        <MicrochainTextLogo />
      </div>

      <p className="text-base text-white">{lpTokenDisplayValue} LP tokens</p>
      <p className="text-base flex justify-between items-center text-white">
        Asset ID: {formattedLpTokenAssetId}
        <IconButton onClick={handleCopy}>
          <Copy className="w-4 h-4" />
        </IconButton>
      </p>
    </div>
  );
}
