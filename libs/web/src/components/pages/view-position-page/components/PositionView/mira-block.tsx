import React, {useCallback} from "react";
import {
  FeatureGuard,
  IconButton,
  MicrochainTextLogo,
} from "@/src/components/common";
import {LogoIcon} from "@/meshwave-ui/icons";
import {PoolId, getLPAssetId} from "mira-dex-ts";
import {formatUnits} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {usePositionData, useFormattedAddress} from "@/src/hooks";
import {Copy} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

export function MiraBlock({
  pool,
  isV2 = false,
  nftAssetId,
}: {
  pool: PoolId;
  isV2?: boolean;
  nftAssetId?: string;
}) {
  // For V2 pools, skip the V1-specific hooks to avoid errors
  const {lpTokenBalance} = usePositionData({pool: isV2 ? undefined : pool});
  const lpTokenDisplayValue = isV2
    ? "N/A"
    : formatUnits(lpTokenBalance || "0", 9);

  // Only call getLPAssetId for V1 pools
  const lpTokenAssetId = isV2
    ? null
    : getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const assetIdToDisplay = isV2 ? nftAssetId : lpTokenAssetId?.bits;
  const formattedAssetId = useFormattedAddress(assetIdToDisplay || "");

  const handleCopy = useCallback(async () => {
    if (assetIdToDisplay) {
      await navigator.clipboard.writeText(assetIdToDisplay);
    }
  }, [assetIdToDisplay]);

  const isEnabled = getIsRebrandEnabled();

  return (
    <div
      className={cn(
        isEnabled &&
          "flex flex-1 flex-col justify-end rounded-ten p-4 bg-black",
        !isEnabled &&
          "flex flex-1 flex-col justify-end rounded-ten bg-gradient-to-r from-[#5872fc] via-[#6142ba] to-[#c41cff] p-4"
      )}
    >
      <FeatureGuard
        fallback={
          <div className="mb-3 h-8 w-16 text-white">
            <LogoIcon />
          </div>
        }
      >
        <div className="mb-3 h-8 w-16">
          <MicrochainTextLogo />
        </div>
      </FeatureGuard>

      {isV2 ? (
        <>
          <p className="text-base text-white">NFT Position</p>
          <p className="text-base flex justify-between items-center text-white">
            Asset ID: {formattedAssetId}
            <IconButton onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </IconButton>
          </p>
        </>
      ) : (
        <>
          <p className="text-base text-white">
            {lpTokenDisplayValue} LP tokens
          </p>
          <p className="text-base flex justify-between items-center text-white">
            Asset ID: {formattedAssetId}
            <IconButton onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </IconButton>
          </p>
        </>
      )}
    </div>
  );
}
