import {useQuery} from "@tanstack/react-query";
import {B256Address, Contract, Provider} from "fuels";
import {NetworkUrl} from "../utils/constants";
import {useAssetMinterContract, useAssetList} from "@/src/hooks";
import src20Abi from "@/src/abis/src20-abi.json";

const providerPromise = new Provider(NetworkUrl);

export function useAssetMetadata(
  assetId: B256Address | null,
): {
  name?: string;
  symbol?: string;
  decimals?: number;
} & {isLoading: boolean} {
  const {assets, isLoading: isLoadingAsset} = useAssetList();

  const {contractId, isLoading: contractLoading} =
    useAssetMinterContract(assetId);

  const {data, isLoading: metadataLoading} = useQuery({
    queryKey: ["assetMetadata", contractId, assetId, assets?.length],
    queryFn: async () => {
      const asset = assets?.find(
        (asset) => asset.assetId.toLowerCase() === assetId?.toLowerCase(),
      );

      // first check if asset in the already fetched list
      if (asset) {
        return {
          name: asset.name,
          symbol: asset.symbol,
          decimals: asset.decimals,
        };
      }

      const provider = providerPromise;
      const src20Contract = new Contract(contractId!, src20Abi, provider);

      const result = await src20Contract
        .multiCall([
          src20Contract.functions.name({bits: assetId}),
          src20Contract.functions.symbol({bits: assetId}),
          src20Contract.functions.decimals({bits: assetId}),
        ])
        .addContracts([
          // The current bridge implementation
          new Contract(
            "0x0ceafc5ef55c66912e855917782a3804dc489fb9e27edfd3621ea47d2a281156",
            src20Abi,
            provider!,
          ),
        ])
        .get();

      return {
        name: result.value[0],
        symbol: result.value[1],
        decimals: result.value[2],
      };
    },
    enabled:
      !!assetId && !!contractId && !isLoadingAsset && assets !== undefined,
    staleTime: Infinity,
  });

  const isLoading = contractLoading || metadataLoading || isLoadingAsset;

  return data
    ? {...data, isLoading}
    : {name: undefined, symbol: undefined, decimals: undefined, isLoading};
}
