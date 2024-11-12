import { useProvider } from "@fuels/react";
import { useQuery } from "@tanstack/react-query";
import { ZeroBytes32 } from "fuels";

const BASE_ASSET_CONTRACT = '0x7e2becd64cd598da59b4d1064b711661898656c6b1f4918a787156b8965dc83c';
const ETH_ASSET_ID = '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07';

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
