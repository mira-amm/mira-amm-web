import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/meshwave-ui/dropdown-menu";
import {
  ArrowLeftRight,
  ChevronDown,
  CopyIcon,
  ExternalLink,
  LogOutIcon,
} from "lucide-react";
import useWeb3React from "@/src/hooks/useWeb3Connection";
import {useFormattedAddress} from "@/src/hooks";
import {useEffect, useRef, useState} from "react";
import TransactionsHistory from "./TransactionsHistory/TransactionsHistory";
import {FuelAppUrl} from "@/src/utils/constants";
import {openNewTab} from "@/src/utils/common";
import {CopyNotification} from "./copy-notification";
import {Button} from "@/meshwave-ui/Button";

export function ConnectWalletNew() {
  const {account, connect, disconnect, isConnected, isWalletLoading} =
    useWeb3React();
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

  const [isAddressCopied, setAddressCopied] = useState(false);

  const handleExplorerClick = () =>
    openNewTab(`${FuelAppUrl}/account/${account}/transactions`);

  const handleCopy = async () => {
    if (isConnected && account) {
      try {
        await navigator.clipboard.writeText(account);
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 3000);
      } catch (error) {
        console.error("Failed to copy address: ", error);
      }
    }
  };

  const handleTxHistoryClick = () => setHistoryOpened(true);

  return (
    <>
      {!isConnected && (
        <div className="rounded-[10px] bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
          <div className="flex gap-x-3 bg-background-grey-dark p-3 rounded-[10px] justify-between">
            <div className="">
              <div className="flex justify-between items-center mb-0.5">
                <span>Power</span>
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
            <div className="bg-black rounded-[10px] text-accent-primary uppercase px-3 tracking-tight flex justify-center items-center text-sm">
              No wallet connected
            </div>
          </div>
        </div>
      )}
      {isConnected && (
        <div className="rounded-[10px] bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
          <div className="flex gap-x-3 bg-background-grey-dark p-3 rounded-[10px] justify-between">
            <div className="">
              <div className="flex justify-between items-center mb-0.5">
                <span>Power</span>
                <div className="h-2 w-5 bg-accent-primary"></div>
              </div>
              <Button
                onClick={disconnect}
                size="xs"
                className="rounded uppercase px-4 text-black"
                variant="destructive"
              >
                Disconnect
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="bg-black rounded-[10px] text-accent-primary uppercase px-3 tracking-tight flex justify-center items-center text-sm">
                  {formattedAddress}
                  <ChevronDown className="text-content-dimmed-dark" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 dark:bg-[#262834] border-0 px-2 py-2.5"
                align="start"
              >
                <DropdownMenuItem
                  onClick={handleCopy}
                  className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer group"
                >
                  <CopyIcon />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExplorerClick}
                  className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
                >
                  <ExternalLink />
                  View in Explorer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleTxHistoryClick}
                  className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
                >
                  <ArrowLeftRight />
                  Transaction History
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
                  onClick={disconnect}
                >
                  <LogOutIcon />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <TransactionsHistory
        onClose={() => setHistoryOpened(false)}
        isOpened={isHistoryOpened}
        ref={transactionsRef}
      />

      {isAddressCopied && (
        <CopyNotification onClose={() => setAddressCopied(false)} />
      )}
    </>
  );
}
