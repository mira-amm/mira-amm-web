import usePoolsIds from "@/src/hooks/usePoolsIds";
import {getLPAssetId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {CoinQuantity} from "fuels";

type Props = {
  balances: CoinQuantity[] | undefined;
}

const usePositions = ({ balances }: Props) => {
  const pools = usePoolsIds();

  const nonZeroBalances = balances?.filter(balance => balance.amount.toNumber() > 0);

  return pools.map(poolId => {
    const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, poolId);
    const lpBalance = nonZeroBalances?.find(balance => balance.assetId === lpAssetId.bits);
    return {
      poolId,
      lpAssetId,
      lpBalance,
    }
  });
};

export default usePositions;
