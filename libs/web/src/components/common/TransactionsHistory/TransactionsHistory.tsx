"use client";

import {forwardRef, useMemo} from "react";
import {Copy, X} from "lucide-react";
import {useAccount, useIsConnected} from "@fuels/react";
import defaultImage from "@/assets/unknown-asset.svg";
import Image from "next/image";
import {useWalletTransactions, useFormattedAddress} from "@/src/hooks";
import {FuelAppUrl} from "@/src/utils/constants";
import {SkeletonLoader} from "@/web/src/components/common";

export const TransactionsHistory = forwardRef<
  HTMLDivElement,
  {
    onClose: () => void;
    isOpened: boolean;
  }
>(function TransactionsHistory({onClose, isOpened}, ref) {
  const {account} = useAccount();
  const {isConnected} = useIsConnected();
  const formattedAddress = useFormattedAddress(account);
  const walletAddress = useMemo(() => {
    return isConnected ? formattedAddress : "Connect Wallet";
  }, [isConnected, formattedAddress]);

  const {transactions, isLoading} = useWalletTransactions(account, isOpened);

  const handleCopy = () => {
    if (navigator.clipboard && account) {
      navigator.clipboard.writeText(account).catch(console.error);
    }
  };

  return (
    <div
      className={
        isOpened
          ? `fixed top-0 left-0 w-screen h-screen bg-black/20 backdrop-blur-sm z-[100]`
          : "absolute top-5 left-1/2"
      }
    >
      <div
        className={`bg-background-secondary border border-border-secondary dark:border-background-primary shadow-lg flex flex-col gap-6 fixed top-[72px] right-0 h-[calc(100vh-197px)] w-full max-w-[472px] px-5 py-4 z-[200] transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${isOpened ? "translate-x-0" : "translate-x-full"} lg:rounded-xl`}
        ref={ref}
      >
        <div className="flex justify-between items-center">
          <h2 className={`text-xl leading-6 text-content-primary`}>
            Transactions History
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={
              "hover:opacity-65 cursor-pointer text-content-tertiary hover:text-content-primary transition-colors"
            }
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={
            "flex flex-col gap-5 p-3 rounded-lg bg-gradient-to-br from-[#663e92] to-[#29294e]"
          }
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/avatar.png"
              alt="avatar"
              className="w-8 h-8 rounded-full"
              width={32}
              height={32}
            />
            <span className="text-base leading-6 text-content-primary">
              {walletAddress}
            </span>
            <button
              onClick={handleCopy}
              className={
                "hover:opacity-65 cursor-pointer text-content-tertiary hover:text-content-primary transition-colors"
              }
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SkeletonLoader isLoading={isLoading} count={6} textLines={2}>
          <ul className="flex flex-col gap-4 list-none">
            {Object.entries(transactions).map(([date, group]) => (
              <li key={date} className="flex flex-col gap-2">
                <span
                  className={"leading-[22px] text-sm text-content-tertiary"}
                >
                  {date}
                </span>
                <ul className="flex flex-col gap-2">
                  {group.map((transaction, index) => (
                    <li key={index} className="flex flex-col gap-2">
                      <div
                        className={
                          "flex gap-7 p-2.5 rounded-lg bg-background-grey-light hover:bg-background-grey-light/80 transition-colors"
                        }
                      >
                        <div className="relative flex items-center">
                          <Image
                            src={transaction.firstAsset?.icon || defaultImage}
                            alt={`${transaction.firstAsset.symbol} icon`}
                            className="w-8 h-8 rounded-full border-2 border-background-secondary"
                            width={32}
                            height={32}
                          />
                          <Image
                            src={transaction.secondAsset?.icon || defaultImage}
                            alt={`${transaction.secondAsset.name} icon`}
                            className="w-8 h-8 rounded-full border-2 border-background-secondary absolute -right-3 z-10"
                            width={32}
                            height={32}
                          />
                        </div>
                        <div className="flex flex-col gap-1 leading-[22px] flex-1 text-sm">
                          <div className="flex items-center gap-2">
                            <a
                              href={`${FuelAppUrl}/tx/${transaction.tx_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={
                                "text-content-primary hover:text-accent-primary transition-colors"
                              }
                            >
                              {transaction.name}
                            </a>
                            <div
                              className={`rounded-full w-2 h-2 ${
                                transaction.withdrawal
                                  ? "bg-accent-warning"
                                  : transaction.addLiquidity
                                    ? "bg-content-positive"
                                    : "bg-accent-primary"
                              }`}
                            ></div>
                          </div>
                          <span className="text-content-tertiary text-xs">
                            {transaction.firstAssetAmount}{" "}
                            {transaction.firstAsset.name}
                            {transaction.addLiquidity || transaction.withdrawal
                              ? " and "
                              : " for "}
                            {transaction.secondAssetAmount}{" "}
                            {transaction.secondAsset.name}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SkeletonLoader>
      </div>

      <div
        className={`fixed right-0 bottom-[125px] w-full max-w-[472px] h-[10%] rounded-xl z-[300] transition-transform duration-300 ease-in-out ${
          isOpened ? "translate-x-0" : "translate-x-full"
        } hidden md:block`}
        style={{
          background:
            "linear-gradient(to bottom, rgba(236,237,240,0) 0%, rgba(236,237,240,0.2) 15%, rgba(236,237,240,0.5) 25%, rgba(236,237,240,0.5) 50%, rgba(236,237,240,0.5) 75%, rgba(236,237,240,0.8) 100%)",
        }}
      ></div>
    </div>
  );
});
