"use client";

import {useMemo, useState, useEffect} from "react";
import assets from "../utils/verified-assets.json";
import {getNetworkDataForChain, CoinData} from "../utils/coinsConfig";

// Simple function to get chainId based on selected network
function getChainId(): number {
  // If we're in local development (NEXT_PUBLIC_FUEL_PROVIDER_URL contains localhost), use chainId 0
  if (process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL?.includes("localhost")) {
    return 0;
  }

  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          return 0; // Testnet uses chainId 0
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }

  return 9889; // Mainnet chainId
}

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
    // Only runs on client - get the actual chainId from localStorage
    setChainId(getChainId());
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
