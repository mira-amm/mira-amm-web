import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  CopyIcon,
  ExternalLink,
  LogOutIcon,
} from "lucide-react";
import {useWeb3Connection, useFormattedAddress} from "@/src/hooks";
import {useEffect, useRef, useState} from "react";
import {TransactionsHistory} from "./TransactionsHistory/TransactionsHistory";
import {FuelAppUrl} from "@/src/utils/constants";
import {openNewTab} from "@/src/utils/common";
import {Button} from "@/meshwave-ui/Button";
import {toast} from "sonner";
import {cn} from "@/src/utils/cn";

interface ConnectWalletNewProps {
  size?: "small" | "large";
  className?: string;
}

export function ConnectWalletNew({
  size = "large",
  className,
}: ConnectWalletNewProps) {
  const {account, connect, disconnect, isConnected, isWalletLoading} =
    useWeb3Connection();
  const formattedAddress = useFormattedAddress(account);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const transactionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutsideTransactions = (event: MouseEvent) => {
      if (
        transactionsRef.current &&
        !transactionsRef.current.contains(event.target as Node)
      ) {
        setHistoryOpened(false);
      }
    };

    if (isHistoryOpened) {
      document.addEventListener("mousedown", handleClickOutsideTransactions);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideTransactions);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideTransactions);
    };
  }, [isHistoryOpened]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Event handlers
  const handleExplorerClick = () =>
    openNewTab(`${FuelAppUrl}/account/${account}/transactions`);

  const handleCopy = async () => {
    if (isConnected && account) {
      try {
        await navigator.clipboard.writeText(account);
        toast.success("Copied address");
      } catch (error) {
        console.error("Failed to copy address: ", error);
      }
    }
  };

  const handleTxHistoryClick = () => setHistoryOpened(true);

  // Common styles
  const containerWidth = size === "large" ? "w-[410px]" : "w-[341.82px]";
  const rightPanelWidth = size === "large" ? "w-[239.82px]" : "w-[239.82px]";
  const textSize = size === "large" ? "text-sm" : "text-xs";

  // Power indicator component
  const PowerIndicator = ({isConnected}: {isConnected: boolean}) => (
    <div className="flex justify-between items-center mb-0.5">
      <span className="text-xs">Power</span>
      <div
        className={cn(
          "h-2 w-5",
          isConnected
            ? "bg-accent-primary shadow-[0_0_10px_#01ec97,0_0_20px_#01ec97aa]"
            : "bg-accent-primary-2"
        )}
      />
    </div>
  );

  // Action button component
  const ActionButton = () => {
    if (!isConnected) {
      return (
        <Button
          onClick={connect}
          disabled={isWalletLoading}
          size="xs"
          className="rounded uppercase px-4"
        >
          Connect
        </Button>
      );
    }

    return (
      <Button
        onClick={() => disconnect()}
        size="xs"
        variant="secondary"
        className="bg-accent-secondary hover:bg-accent-secondary-1 rounded uppercase px-4 text-black transition-colors duration-300"
      >
        Disconnect
      </Button>
    );
  };

  // Right panel component
  const RightPanel = () => {
    if (!isConnected) {
      return (
        <div
          className={cn(
            "bg-black rounded-ten font-alt text-accent-primary uppercase px-3 tracking-tight flex justify-left items-center",
            rightPanelWidth,
            textSize
          )}
        >
          No wallet connected
        </div>
      );
    }

    return (
      <div
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "bg-black rounded-ten text-accent-primary font-alt uppercase px-3 tracking-tight flex justify-between items-center cursor-pointer",
          rightPanelWidth,
          textSize
        )}
      >
        {formattedAddress}
        {open ? (
          <ChevronUp className="text-content-dimmed-dark text-mc-blue" />
        ) : (
          <ChevronDown className="text-content-dimmed-dark text-mc-blue" />
        )}
      </div>
    );
  };

  // Dropdown menu component
  const DropdownMenu = () => {
    if (!open || !isConnected) return null;

    return (
      <div className="absolute left-0 mt-2 w-full border-[12px] border-border-secondary dark:border-0 bg-background-grey-dark dark:bg-[#262834] px-2 py-2.5 rounded-ten z-50">
        <div
          onClick={() => {
            handleCopy();
            setOpen(false);
          }}
          className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-ten cursor-pointer flex items-center gap-2"
        >
          <CopyIcon className="size-4 dark:text-white" />
          Copy Address
        </div>
        <div
          onClick={() => {
            handleExplorerClick();
            setOpen(false);
          }}
          className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-ten cursor-pointer flex items-center gap-2"
        >
          <ExternalLink className="size-4 dark:text-white" />
          View in Explorer
        </div>
        <div
          onClick={() => {
            handleTxHistoryClick();
            setOpen(false);
          }}
          className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-ten cursor-pointer flex items-center gap-2"
        >
          <ArrowLeftRight className="size-4 dark:text-white" />
          Transaction History
        </div>
        <div
          onClick={() => {
            disconnect();
            setOpen(false);
          }}
          className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-ten cursor-pointer flex items-center gap-2"
        >
          <LogOutIcon className="size-4 dark:text-white" />
          Disconnect
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn(`relative ${containerWidth}`, className)}
      >
        <div className={cn("rounded-ten dark:border-0", className)}>
          <div className="flex gap-x-1.5! dark:bg-background-grey-dark">
            <div>
              <PowerIndicator isConnected={isConnected} />
              <ActionButton />
            </div>
            <RightPanel />
          </div>
          <DropdownMenu />
        </div>
      </div>

      <TransactionsHistory
        onClose={() => setHistoryOpened(false)}
        isOpened={isHistoryOpened}
        ref={transactionsRef}
      />
    </>
  );
}
