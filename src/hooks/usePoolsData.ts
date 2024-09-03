import {useQuery} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import type {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultTxParams} from "@/src/utils/constants";

const usePoolsData = () => {
  const mira = useMiraDex();
  const miraExists = Boolean(mira);

  const coinsArray = Array.from(coinsConfig.values());
  const assetIds = coinsArray.map(coin => coin.assetId);
  const assetPairs: [AssetIdInput, AssetIdInput][] = [];

  for (let i = 0; i < assetIds.length; i++) {
    for (let j = i + 1; j < assetIds.length; j++) {
      assetPairs.push([{ bits: assetIds[i] }, { bits: assetIds[j] }]);
    }
  }

  const shouldFetch = miraExists;

  const { data, isPending } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const poolInfoPromises = assetPairs.map(pair => mira?.poolInfo(pair, DefaultTxParams));
      const poolInfoResults = await Promise.all(poolInfoPromises);
      return poolInfoResults.map(poolInfoResult => {
        if (!poolInfoResult) {
          return null;
        }

        const coinA = coinsArray.find(coin => coin.assetId === poolInfoResult.value.reserves.a.id.bits)?.name;
        const coinB = coinsArray.find(coin => coin.assetId === poolInfoResult.value.reserves.b.id.bits)?.name;
        if (coinA && coinB) {
          const key = `${coinA}-${coinB}`;
          return {
            key,
            value: poolInfoResult.value,
          };
        }

        return null;
      });
    },
    enabled: shouldFetch,
  });

  return { data, isPending };
};

export default usePoolsData;
