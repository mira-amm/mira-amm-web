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

export function ConnectWalletNew() {
  const {account, connect, disconnect, isConnected, isWalletLoading} =
    useWeb3Connection();
  const formattedAddress = useFormattedAddress(account);
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const transactionsRef = useRef<HTMLDivElement>(null);

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

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {!isConnected && (
        <div className="rounded-[10px] border-border-secondary border-[12px] dark:border-0">
          <div className="flex gap-x-3 p-3 justify-between bg-background-grey-dark dark:bg-background-grey-dark">
            <div className="">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs">Power</span>
                <div className="h-2 w-5 bg-accent-primary-2"></div>
              </div>
              <Button
                onClick={connect}
                disabled={isWalletLoading}
                size="xs"
                className="rounded uppercase px-4"
              >
                Connect
              </Button>
            </div>
            <div className="w-[239.82px] bg-black rounded-[10px] font-alt text-accent-primary uppercase px-3 tracking-tight flex justify-left items-center text-sm">
              No wallet connected
            </div>
          </div>
        </div>
      )}
      {isConnected && (
        <div ref={containerRef} className="relative w-[410px]">
          <div className="rounded-[10px] border-[12px] border-border-secondary dark:border-0">
            <div className="flex gap-x-3 p-3 justify-between bg-background-grey-dark dark:bg-background-grey-dark">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs">Power</span>
                  <div className="h-2 w-5 bg-accent-primary shadow-[0_0_10px_#01ec97,0_0_20px_#01ec97aa]" />
                </div>
                <Button
                  onClick={() => {
                    disconnect();
                  }}
                  size="xs"
                  className="bg-[#F95465] hover:bg-[#d71b2d] rounded uppercase px-4 text-black transition-colors duration-300"
                >
                  Disconnect
                </Button>
              </div>

              <div
                onClick={() => setOpen((prev) => !prev)}
                className="bg-black rounded-lg w-[239.82px] text-accent-primary font-alt uppercase px-3 tracking-tight flex justify-between items-center text-sm cursor-pointer"
              >
                {formattedAddress}
                {open ? (
                  <ChevronUp className="text-content-dimmed-dark text-mc-blue" />
                ) : (
                  <ChevronDown className="text-content-dimmed-dark text-mc-blue" />
                )}
              </div>
            </div>
          </div>

          {open && (
            <div className="absolute left-0 mt-2 w-full border-[12px] border-border-secondary dark:border-0 bg-background-grey-dark dark:bg-[#262834] px-2 py-2.5 rounded-[10px] z-50">
              <div
                onClick={() => {
                  handleCopy();
                  setOpen(false);
                }}
                className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <CopyIcon className="size-4 dark:text-white" />
                Copy Address
              </div>
              <div
                onClick={() => {
                  handleExplorerClick();
                  setOpen(false);
                }}
                className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <ExternalLink className="size-4 dark:text-white" />
                View in Explorer
              </div>
              <div
                onClick={() => {
                  handleTxHistoryClick();
                  setOpen(false);
                }}
                className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <ArrowLeftRight className="size-4 dark:text-white" />
                Transaction History
              </div>
              <div
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="hover:bg-background-tertiary dark:hover:bg-background-secondary p-2 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <LogOutIcon className="size-4 dark:text-white" />
                Disconnect
              </div>
            </div>
          )}
        </div>
      )}

      <TransactionsHistory
        onClose={() => setHistoryOpened(false)}
        isOpened={isHistoryOpened}
        ref={transactionsRef}
      />
    </>
  );
}
