import {useCallback} from "react";
import {BN} from "fuels";
import {PoolId} from "mira-dex-ts";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";

type UseLiquidityActionsProps = {
  sufficientEthBalance: boolean;
  firstAmount: BN;
  secondAmount: BN;
  poolId: PoolId;
  isStablePool: boolean;
  onPreview?: (data: any) => void;
};

export const useLiquidityActions = ({
  sufficientEthBalance,
  firstAmount,
  secondAmount,
  poolId,
  isStablePool,
  onPreview,
}: UseLiquidityActionsProps) => {
  const handleButtonClick = useCallback(() => {
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`);
      return;
    }

    const previewData = {
      assets: [
        {
          amount: firstAmount,
          assetId: poolId[0].bits,
        },
        {
          amount: secondAmount,
          assetId: poolId[1].bits,
        },
      ],
      isStablePool,
    };

    if (onPreview) {
      onPreview(previewData);
    } else {
      console.log(previewData);
    }
  }, [
    sufficientEthBalance,
    firstAmount,
    secondAmount,
    poolId,
    isStablePool,
    onPreview,
  ]);

  return {handleButtonClick};
};
