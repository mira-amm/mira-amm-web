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
import {Button} from "@/meshwave-ui/Button"

export function ConnectWallet() {
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
        <Button
          onClick={connect}
          disabled={isWalletLoading}
          className="h-10 bg-accent-primary text-old-mira-text border border-accent-primary shadow-[1px_1px_20px_0_#a1db0b4d] hover:shadow-[1px_1px_30px_0_#a1db0b4d] hover:bg-old-mira-active-btn cursor-pointer"
        >
          Connect Wallet
        </Button>
      )}
      {isConnected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2.5 px-2 py-4 h-10 text-content-primary bg-transparent border border-accent-primary hover:shadow-none hover:text-none active:bg-transparent hover:bg-transaparent"
            >
              <img src="/images/avatar.png" width="24" height="24" />
              {formattedAddress}
              <ChevronDown className="text-content-dimmed-dark" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-[#262834] border-0 px-2 py-2.5"
            align="start"
          >
            <DropdownMenuItem
              onClick={handleCopy}
              className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
            >
              <CopyIcon className="text-content-grey" />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExplorerClick}
              className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
            >
              <ExternalLink className="text-content-grey" />
              View in Explorer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTxHistoryClick}
              className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
            >
              <ArrowLeftRight className="text-content-grey" />
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-background-grey-dark hover:text-content-primary py-3 cursor-pointer"
              onClick={disconnect}
            >
              <LogOutIcon className="text-content-grey" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
