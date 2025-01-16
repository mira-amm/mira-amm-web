import {useQuery} from "@tanstack/react-query";
import {useAssetMinterContract} from "./useAssetMinterContract";
import useProvider from "./useProvider/useProvider";
import src7Abi from "@/src/abis/src7-abi.json";
import {Contract, Provider} from "fuels";
import {NetworkUrl} from "../utils/constants";

const ETH_ASSET_ID =
  "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07";
const NATIVE_BRIDGE_MINTER_CONTRACT =
  "0x4ea6ccef1215d9479f1024dff70fc055ca538215d2c8c348beddffd54583d0e8";

const providerPromise = Provider.create(NetworkUrl);

export const useAssetPrice = (
  assetId: string | null,
): {price: number | null; isLoading: boolean} => {
  const {contractId} = useAssetMinterContract(assetId);

  const {data, isLoading} = useQuery({
    queryKey: ["assetPrice", assetId],
    queryFn: async () => {
      const provider = await providerPromise;
      const src7Contract = new Contract(
        NATIVE_BRIDGE_MINTER_CONTRACT,
        src7Abi,
        provider!,
      );

      let l1Address: string;
      if (assetId === ETH_ASSET_ID) {
        l1Address = "0x0000000000000000000000000000000000000000";
      } else {
        const result = await src7Contract.functions
          .metadata({bits: assetId}, "bridged:address")
          .addContracts([
            // The current bridge implementation
            new Contract(
              "0x0ceafc5ef55c66912e855917782a3804dc489fb9e27edfd3621ea47d2a281156",
              src7Abi,
              provider!,
            ),
          ])
          .get();
        l1Address = "0x" + result.value.B256.substring(26);
      }

      const req = await fetch(
        `https://coins.llama.fi/prices/current/ethereum:${l1Address}`,
      );
      const res = await req.json();

      return res.coins[`ethereum:${l1Address}`]?.price || null;
    },
    enabled:
      !!assetId &&
      (contractId === NATIVE_BRIDGE_MINTER_CONTRACT ||
        assetId === ETH_ASSET_ID),
    staleTime: Infinity,
  });

  return {price: data || null, isLoading};
};
