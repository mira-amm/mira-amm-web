import { useProvider } from "@fuels/react";
import { useQuery } from "@tanstack/react-query";
import { ZeroBytes32 } from "fuels";
import { BASE_ASSET_CONTRACT, ETH_ASSET_ID } from "../utils/constants";

export const useAssetMinterContract = (assetId: string | null): { contractId: string | null; subId: string | null } => {
  if (assetId && assetId.length !== 66) {
    throw new Error('Invalid assetId');
  }

  const { data } = useQuery({
    queryKey: ['assetMinter', assetId],
    queryFn: async () => {
      if (assetId === ETH_ASSET_ID) {
        return {
          contractId: BASE_ASSET_CONTRACT,
          subId: ZeroBytes32,
        };
      }

      const req = await fetch(`https://mainnet-explorer.fuel.network/assets/${assetId}`);
      const res = await req.json();

      return res as { contractId: string; subId: string };
    },
    enabled: assetId !== null,
    staleTime: Infinity,
  });

  return data || { contractId: null, subId: null };
};
