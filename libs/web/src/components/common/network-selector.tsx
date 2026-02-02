"use client";

import {clsx} from "clsx";
import {ChevronDown, Wifi, WifiOff} from "lucide-react";
import {FuelIcon} from "@/meshwave-ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/meshwave-ui/dropdown-menu";
import {
  useNetworkStore,
  NETWORK_CONFIGS,
  type NetworkId,
} from "@/src/stores/useNetworkStore";

interface NetworkSelectorProps {
  className?: string;
}

export function NetworkSelector({className}: NetworkSelectorProps) {
  const {selectedNetwork, setNetwork} = useNetworkStore();
  const currentConfig =
    NETWORK_CONFIGS[selectedNetwork] ?? NETWORK_CONFIGS.mainnet;

  const isMainnet = selectedNetwork === "mainnet";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer font-normal transition-colors",
            "hover:bg-background-grey-light/50",
            "border border-transparent hover:border-content-dimmed-dark/20",
            isMainnet
              ? "text-green-400"
              : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
            className
          )}
        >
          <div className="relative">
            <FuelIcon />
            {!isMainnet && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm">{currentConfig.name}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="bg-background-grey-dark border-content-dimmed-dark/20 min-w-[180px]"
      >
        <div className="px-3 py-2 text-xs text-content-dimmed-light border-b border-content-dimmed-dark/20">
          Select Network
        </div>

        {(Object.keys(NETWORK_CONFIGS) as NetworkId[]).map((networkId) => {
          const config = NETWORK_CONFIGS[networkId];
          const isSelected = selectedNetwork === networkId;
          const isMainnetOption = networkId === "mainnet";

          return (
            <DropdownMenuItem
              key={networkId}
              onClick={() => {
                if (!isSelected) {
                  setNetwork(networkId);
                }
              }}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                isSelected && "bg-background-grey-light/30"
              )}
            >
              <div
                className={clsx(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  isMainnetOption ? "bg-green-400/20" : "bg-yellow-400/20"
                )}
              >
                {isMainnetOption ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-yellow-400" />
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={clsx(
                    "text-sm font-medium",
                    isMainnetOption ? "text-green-400" : "text-yellow-400"
                  )}
                >
                  {config.name}
                </span>
                <span className="text-xs text-content-dimmed-light">
                  {isMainnetOption ? "Production" : "Testing"}
                </span>
              </div>

              {isSelected && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
              )}
            </DropdownMenuItem>
          );
        })}

        {selectedNetwork === "testnet" && (
          <div className="px-3 py-2 text-xs text-yellow-400/80 border-t border-content-dimmed-dark/20 bg-yellow-400/5">
            ⚠️ Testnet uses test tokens with no real value
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
