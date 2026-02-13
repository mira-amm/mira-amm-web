"use client";

import {useMemo, useState, useEffect} from "react";
import assets from "../utils/verified-assets.json";
import {getNetworkDataForChain, CoinData} from "../utils/coinsConfig";
import {getSelectedNetwork, NETWORK_CONFIGS} from "@/src/stores/useNetworkStore";

// Move the logic outside of React hooks to avoid re-render issues
function getVerifiedAssetsForChain(chainId: number): CoinData[] {
  const assetsArray: CoinData[] = [];

  assets.forEach((asset) => {
    const networkData = getNetworkDataForChain(asset, chainId);

    // Skip assets that don't have fuel network data for this chain
    if (!networkData || !networkData.assetId) {
      return;
    }

    const assetData: CoinData = {
      name: asset.name,
      symbol: asset.symbol,
      assetId: networkData.assetId,
      decimals: networkData.decimals,
      icon: asset.icon,
      isVerified: true, // Assets from verified-assets.json are verified by definition
      contractId: networkData.contractId,
      subId: networkData.subId,
      l1Address: networkData.address, // Ethereum address if available
    };

    assetsArray.push(assetData);
  });

  return assetsArray;
}

export function useVerifiedAssetsForChain() {
  // Use state to ensure proper client-side hydration
  // Default to mainnet for SSR, then update on client
  const [chainId, setChainId] = useState(9889);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only runs on client - get the actual chainId from the network store
    setChainId(NETWORK_CONFIGS[getSelectedNetwork()].chainId);
    setIsLoading(false);
  }, []);

  const verifiedAssetsForChain = useMemo(() => {
    return getVerifiedAssetsForChain(chainId);
  }, [chainId]);

  return {
    verifiedAssetsForChain,
    chainId,
    isLoading,
  };
}
