import {create} from "zustand";
import {persist} from "zustand/middleware";

export type NetworkId = "mainnet" | "testnet" | "local";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  chainId: number;
  providerUrl: string;
  explorerUrl: string;
  indexerUrl: string;
  contractId: string;
  // V2 contract (concentrated liquidity) - only on testnet for now
  v2ContractId?: string;
}

// Network configurations
export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  mainnet: {
    id: "mainnet",
    name: "Mainnet",
    chainId: 9889, // CHAIN_IDS.fuel.mainnet
    providerUrl: "https://mainnet.fuel.network/v1/graphql",
    explorerUrl: "https://mainnet-explorer.fuel.network",
    indexerUrl: "https://mira-dex.squids.live/mira-indexer@v4/api/graphql",
    contractId:
      "0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7",
  },
  testnet: {
    id: "testnet",
    name: "Testnet",
    chainId: 0, // Fuel testnet chain ID
    providerUrl: "https://testnet.fuel.network/v1/graphql",
    explorerUrl: "https://app-testnet.fuel.network",
    indexerUrl: "https://mira-dex.squids.live/mira-testnet-indexer@test/api/graphql",
    // V1 AMM contract on testnet (from Pavel)
    contractId:
      "0xd5a716d967a9137222219657d7877bd8c79c64e1edb5de9f2901c98ebe74da80",
    // V2 concentrated liquidity (binned) contract on testnet (from Pavel)
    v2ContractId:
      "0x826908f28ebcab59bbe8c2cc9f0e9b2e12a244517cadce0aba6f534ecbbc2c2b",
  },
  local: {
    id: "local",
    name: "Local",
    chainId: 31337, // Local fuel-core uses chainId 31337 to avoid collision with testnet (chainId 0)
    providerUrl: "http://127.0.0.1:4000/v1/graphql",
    explorerUrl: "", // No explorer for local
    indexerUrl: "http://127.0.0.1:4350/graphql", // Must be 127.0.0.1 not localhost for isLocal detection
    // Contract IDs from env vars — change every restart of `pnpm fuels dev`
    contractId: process.env.NEXT_PUBLIC_LOCAL_PROXY_CONTRACT_ID ?? "",
    v2ContractId: process.env.NEXT_PUBLIC_LOCAL_V2_CONTRACT_ID ?? "",
  },
};

// Networks available in the UI — local is only shown during development
export const AVAILABLE_NETWORK_IDS: NetworkId[] =
  process.env.NODE_ENV === "development"
    ? ["mainnet", "testnet", "local"]
    : ["mainnet", "testnet"];

interface NetworkState {
  selectedNetwork: NetworkId;
  setNetwork: (network: NetworkId) => void;
  getConfig: () => NetworkConfig;
}

const NETWORK_STORAGE_KEY = "mira-selected-network";

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      selectedNetwork: "mainnet",

      setNetwork: (network: NetworkId) => {
        set({selectedNetwork: network});
        // Force a page reload to reinitialize providers with new network
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      },

      getConfig: () => {
        const network = get().selectedNetwork;
        return NETWORK_CONFIGS[network] ?? NETWORK_CONFIGS.mainnet;
      },
    }),
    {
      name: NETWORK_STORAGE_KEY,
      partialize: (state) => ({selectedNetwork: state.selectedNetwork}),
      // Validate persisted state to handle invalid localStorage values
      // Also reset to mainnet if "local" is persisted but unavailable (e.g., production build)
      onRehydrateStorage: () => (state) => {
        if (state && !AVAILABLE_NETWORK_IDS.includes(state.selectedNetwork)) {
          state.selectedNetwork = "mainnet";
        }
      },
    }
  )
);

// Helper to read selected network outside React (replaces duplicated localStorage reads)
export function getSelectedNetwork(): NetworkId {
  return useNetworkStore.getState().selectedNetwork;
}

// Helper function to get current network config (can be used outside React)
export const getCurrentNetworkConfig = (): NetworkConfig => {
  const selectedNetwork = useNetworkStore.getState().selectedNetwork;
  // Fallback to mainnet if selected network is invalid
  return NETWORK_CONFIGS[selectedNetwork] ?? NETWORK_CONFIGS.mainnet;
};

// Helper to check if we're on testnet
export const isTestnet = (): boolean => {
  return useNetworkStore.getState().selectedNetwork === "testnet";
};

// Helper to check if we're on local
export const isLocal = (): boolean => {
  return useNetworkStore.getState().selectedNetwork === "local";
};

// Helper to check if V2 (concentrated liquidity) is available on the current network
export const isV2Available = (): boolean => {
  const config = getCurrentNetworkConfig();
  return Boolean(config.v2ContractId);
};
