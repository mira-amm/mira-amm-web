import {useMemo} from "react";
import assets from "../utils/verified-assets.json";
import {getNetworkDataForChain, CoinData} from "../utils/coinsConfig";

// Simple function to get chainId from environment variables
function getChainId(): number {
  // If we're in local development (NEXT_PUBLIC_FUEL_PROVIDER_URL contains localhost), use chainId 0
  // Otherwise use mainnet chainId 9889
  // Note: We use chain name "local_testnet" for filtering, not chainId
  return process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL?.includes("localhost")
    ? 0
    : 9889;
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
  // Simple: get chainId from environment variables
  const chainId = getChainId();

  // This will only recalculate if the component re-mounts (which is rare)
  const verifiedAssetsForChain = useMemo(() => {
    return getVerifiedAssetsForChain(chainId);
  }, [chainId]);

  return {
    verifiedAssetsForChain,
    chainId,
    isLoading: false,
  };
}
