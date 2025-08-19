import {useMemo} from "react";
import {PoolId} from "mira-dex-ts";
import {createPoolIdFromIdString} from "@/src/utils/common";
import {
  useAssetMetadata,
  useAssetPrice,
  useAssetBalance,
  useBalances,
} from "@/src/hooks";

export const usePoolAssets = (poolKey: string) => {
  const poolId = useMemo(() => createPoolIdFromIdString(poolKey), [poolKey]);
  const {balances} = useBalances();

  const firstAssetId = poolId[0].bits;
  const secondAssetId = poolId[1].bits;
  const isStablePool = poolId[2];

  const asset0Metadata = useAssetMetadata(firstAssetId);
  const asset1Metadata = useAssetMetadata(secondAssetId);

  const firstAssetBalance = useAssetBalance(balances, firstAssetId);
  const secondAssetBalance = useAssetBalance(balances, secondAssetId);

  const {price: asset0Price} = useAssetPrice(firstAssetId);
  const {price: asset1Price} = useAssetPrice(secondAssetId);

  return {
    poolId,
    firstAssetId,
    secondAssetId,
    isStablePool,
    asset0Metadata,
    asset1Metadata,
    firstAssetBalance,
    secondAssetBalance,
    asset0Price,
    asset1Price,
  };
};
