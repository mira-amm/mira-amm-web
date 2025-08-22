import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {CoinDataWithPrice, coinsConfig} from "@/src/utils/coinsConfig";
import {VerifiedAssets} from "@/src/utils/checkIfCoinVerified";

type Assets = {
  image: string;
  name: string;
  symbol: string;
  id: string;
  decimals: number;
  numPools: string | number;
  l1Address: string;
  price: number;
  contractId: string;
  subId: string;
}[];

export const fetchAssetList = async (): Promise<CoinDataWithPrice[]> => {
  const query = gql`
    query MyQuery {
      assets(where: {numPools_gt: 0}) {
        image
        name
        symbol
        id
        decimals
        numPools
        l1Address
        price
        contractId
        subId
      }
    }
  `;

  const results = await request<{assets: Assets}>({
    url: SQDIndexerUrl,
    document: query,
  });

  const assets = results.assets.map((asset): CoinDataWithPrice => {
    const config = coinsConfig.get(asset.id);

    return {
      assetId: asset.id,
      name: config?.name || asset.name,
      symbol: config?.symbol || asset.symbol,
      decimals: asset.decimals,
      icon: config?.icon || asset.image,
      l1Address: asset.l1Address,
      contractId: asset.contractId,
      subId: asset.subId,
      price: asset.price,
      isVerified: config?.isVerified || false,
    };
  });

  return assets;
};

export const fetchVerifiedAssets = async (): Promise<VerifiedAssets> => {
  const req = await fetch(`https://verified-assets.fuel.network/assets.json`);
  const res = await req.json();
  return res as VerifiedAssets;
};

export const assetQueryKeys = {
  assets: ["assets"] as const,
  verifiedAssets: ["verifiedAssets"] as const,
};

export const assetListQueryOptions = {
  queryKey: assetQueryKeys.assets,
  queryFn: fetchAssetList,
  staleTime: 3 * 60 * 60 * 1000, // 3 hours
  meta: {persist: true},
};

export const verifiedAssetsQueryOptions = {
  queryKey: assetQueryKeys.verifiedAssets,
  queryFn: fetchVerifiedAssets,
  staleTime: Infinity,
  meta: {persist: true},
};
