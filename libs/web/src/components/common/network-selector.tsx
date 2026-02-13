"use client";

import {clsx} from "clsx";
import {ChevronDown, Monitor, Wifi, WifiOff} from "lucide-react";
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
  AVAILABLE_NETWORK_IDS,
  type NetworkId,
} from "@/src/stores/useNetworkStore";

const NETWORK_STYLES: Record<NetworkId, {
  text: string;
  bg: string;
  iconBg: string;
  label: string;
  Icon: typeof Wifi;
}> = {
  mainnet: {text: "text-green-400", bg: "bg-green-400/20", iconBg: "bg-green-400/20", label: "Production", Icon: Wifi},
  testnet: {text: "text-yellow-400", bg: "bg-yellow-400/20", iconBg: "bg-yellow-400/20", label: "Testing", Icon: WifiOff},
  local: {text: "text-blue-400", bg: "bg-blue-400/20", iconBg: "bg-blue-400/20", label: "Development", Icon: Monitor},
};

interface NetworkSelectorProps {
  className?: string;
}

export function NetworkSelector({className}: NetworkSelectorProps) {
  const {selectedNetwork, setNetwork} = useNetworkStore();
  const currentConfig =
    NETWORK_CONFIGS[selectedNetwork] ?? NETWORK_CONFIGS.mainnet;

  const triggerColor =
    selectedNetwork === "mainnet"
      ? "text-green-400"
      : selectedNetwork === "local"
        ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
        : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const pulseColor =
    selectedNetwork === "local" ? "bg-blue-400" : "bg-yellow-400";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer font-normal transition-colors",
            "hover:bg-background-grey-light/50",
            "border border-transparent hover:border-content-dimmed-dark/20",
            triggerColor,
            className
          )}
        >
          <div className="relative">
            <FuelIcon />
            {selectedNetwork !== "mainnet" && (
              <span className={clsx("absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse", pulseColor)} />
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

        {AVAILABLE_NETWORK_IDS.map((networkId) => {
          const config = NETWORK_CONFIGS[networkId];
          const isSelected = selectedNetwork === networkId;
          const style = NETWORK_STYLES[networkId];
          const {Icon} = style;

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
                  style.iconBg
                )}
              >
                <Icon className={clsx("w-4 h-4", style.text)} />
              </div>

              <div className="flex flex-col">
                <span
                  className={clsx("text-sm font-medium", style.text)}
                >
                  {config.name}
                </span>
                <span className="text-xs text-content-dimmed-light">
                  {style.label}
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
            Testnet uses test tokens with no real value
          </div>
        )}
        {selectedNetwork === "local" && (
          <div className="px-3 py-2 text-xs text-blue-400/80 border-t border-content-dimmed-dark/20 bg-blue-400/5">
            Using local fuel-core node
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
