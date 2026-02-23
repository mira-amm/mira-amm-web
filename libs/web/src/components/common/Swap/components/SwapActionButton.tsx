import {Button} from "@/meshwave-ui/Button";
import {Loader} from "@/src/components/common";
import {cn} from "@/src/utils/cn";

export function SwapActionButton({
  isConnected,
  isConnecting,
  connect,
  isActionDisabled,
  isActionLoading,
  handleSwapClick,
  swapButtonTitle,
  isRebrandingEnabled,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  isActionDisabled: boolean;
  isActionLoading: boolean;
  handleSwapClick: () => void;
  swapButtonTitle: string;
  isRebrandingEnabled: boolean;
}) {
  return !isConnected ? (
    <Button
      onClick={connect}
      disabled={isConnecting}
      size="2xl"
      className={cn(
        !isConnected &&
          isRebrandingEnabled &&
          "bg-accent-primary border-0 text-black hover:bg-accent-primary-1 shadow-none disabled:opacity-100"
      )}
    >
      Connect Wallet
    </Button>
  ) : (
    <Button
      disabled={isActionDisabled || isActionLoading}
      aria-busy={isActionLoading || undefined}
      onClick={handleSwapClick}
      size="2xl"
      className={cn(
        isActionDisabled &&
          isRebrandingEnabled &&
          "bg-accent-primary border-0 text-black hover:bg-accent-primary-1 shadow-none disabled:opacity-100"
      )}
    >
      {isActionLoading ? (
        <Loader rebrand={isRebrandingEnabled} />
      ) : (
        swapButtonTitle
      )}
    </Button>
  );
}
