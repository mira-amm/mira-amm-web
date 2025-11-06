/**
 * CoinMarketCap Info Endpoint v1
 * @api {get} /api/cmc/v1/info Get Mira DEX contract and network information
 * 
 * Section C0: Factory Contract Address requirement
 * Provides contract addresses and network information for verification
 */
import {NextResponse} from "next/server";
import {
  DEFAULT_AMM_CONTRACT_ID,
  BASE_ASSET_CONTRACT,
  NetworkUrl,
  SQDIndexerUrl,
  FuelAppUrl,
  ValidNetworkChainId,
} from "@/web/src/utils/constants";

export async function GET() {
  const info = {
    // Network Information
    network: {
      name: "Fuel Mainnet",
      chainId: ValidNetworkChainId,
      networkUrl: NetworkUrl,
      explorerUrl: FuelAppUrl,
    },
    
    // Contract Addresses
    contracts: {
      // V1 AMM Contract (Factory/Main Contract)
      v1_amm: DEFAULT_AMM_CONTRACT_ID,
      
      // V2 Concentrated Liquidity Contract (SimpleProxy)
      // Note: V2 uses a proxy pattern for pool creation
      v2_proxy: process.env.NEXT_PUBLIC_LOCAL_PROXY_CONTRACT_ID || null,
      
      // Base Asset Contract (ETH)
      base_asset: BASE_ASSET_CONTRACT,
    },
    
    // Protocol Information
    protocol: {
      name: "Mira DEX",
      version: {
        v1: {
          type: "AMM",
          description: "Constant product automated market maker",
          fee: "0.3%",
        },
        v2: {
          type: "Concentrated Liquidity",
          description: "Bin-based concentrated liquidity pools",
          fee: "Variable per pool",
        },
      },
    },
    
    // Indexer Information
    indexer: {
      url: SQDIndexerUrl,
      type: "SubSquid",
      description: "GraphQL indexer for all on-chain pool and trade data",
    },
    
    // Explorer Links
    explorerLinks: {
      v1Contract: `${FuelAppUrl}/contract/${DEFAULT_AMM_CONTRACT_ID}`,
      assetExplorer: `${FuelAppUrl}/asset`,
    },
  };

  return NextResponse.json(info, {
    headers: {
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours (static data)
    },
  });
}

