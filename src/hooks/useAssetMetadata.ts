import {useQuery} from "@tanstack/react-query";
import {B256Address, Contract, Provider} from "fuels";
import src20Abi from "@/src/abis/src20-abi.json";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {NetworkUrl} from "../utils/constants";
import {CoinData, coinsConfig} from "../utils/coinsConfig";
import {useAssetImage} from "./useAssetImage";

const providerPromise = Provider.create(NetworkUrl);

const useAssetMetadata = (
  assetId: B256Address | null,
): {asset: CoinData | undefined; isLoading: boolean} => {
  const {contractId, isLoading: contractLoading} =
    useAssetMinterContract(assetId);

  const icon = useAssetImage(assetId);

  const {data, isLoading: metadataLoading} = useQuery<{
    name: string;
    decimals: number;
    symbol: string;
  }>({
    queryKey: ["assetMetadata", contractId, assetId],
    queryFn: async () => {
      const config = coinsConfig.get(assetId);
      if (config) {
        return {
          name: config.name,
          symbol: config.symbol,
          decimals: config.decimals,
        };
      }

      const provider = await providerPromise;
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
    enabled: !!assetId && !!contractId,
    staleTime: Infinity,
  });

  const isLoading = contractLoading || metadataLoading;

  return {
    asset: data && assetId ? {...data, assetId, icon} : undefined,
    isLoading,
  };

  // return data
  //   ? {...data, isLoading}
  //   : {name: undefined, symbol: undefined, decimals: undefined, isLoading};
};

export default useAssetMetadata;
