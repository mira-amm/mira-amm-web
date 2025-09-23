"use client";

import {forwardRef, useMemo} from "react";
import {Copy, X} from "lucide-react";
import {useAccount, useIsConnected} from "@fuels/react";
import defaultImage from "@/assets/unknown-asset.svg";
import Image from "next/image";
import {useWalletTransactions, useFormattedAddress} from "@/src/hooks";
import {FuelAppUrl} from "@/src/utils/constants";
import {SkeletonLoader} from "@/web/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

export const TransactionsHistory = forwardRef<
  HTMLDivElement,
  {
    onClose: () => void;
    isOpened: boolean;
  }
>(function TransactionsHistory({onClose, isOpened}, ref) {
  const {account} = useAccount();
  const {isConnected} = useIsConnected();
  const rebrandEnabled = getIsRebrandEnabled();
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
          ? `fixed top-0 left-0 w-screen h-screen ${rebrandEnabled ? "bg-black/20" : "bg-black/35"} backdrop-blur-sm z-[100]`
          : "absolute top-5 left-1/2"
      }
    >
      <div
        className={`${
          rebrandEnabled
            ? "bg-background-secondary border border-border-secondary dark:border-background-primary shadow-lg"
            : "bg-background-grey-dark border-border-secondary border-[12px] dark:bg-background-primary"
        } flex flex-col gap-6 fixed top-[72px] right-0 h-[calc(100vh-197px)] w-full max-w-[472px] px-5 py-4 z-[200] transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${isOpened ? "translate-x-0" : "translate-x-full"} lg:rounded-xl`}
        ref={ref}
      >
        <div className="flex justify-between items-center">
          <h2
            className={`text-xl leading-6 ${rebrandEnabled ? " text-content-primary" : "font-normal"}`}
          >
            Transactions History
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`hover:opacity-65 cursor-pointer ${rebrandEnabled ? "text-content-tertiary hover:text-content-primary transition-colors" : ""}`}
          >
            <X size={rebrandEnabled ? 20 : 24} />
          </button>
        </div>

        <div
          className={`flex flex-col gap-5 p-3 ${
            rebrandEnabled
              ? "rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 border border-accent-primary/20"
              : "rounded-lg bg-gradient-to-br from-[#663e92] to-[#29294e]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/avatar.png"
              alt="avatar"
              className={rebrandEnabled ? "w-8 h-8 rounded-full" : "w-8 h-8"}
              width={32}
              height={32}
            />
            <span
              className={`text-base leading-6 ${
                rebrandEnabled
                  ? " text-content-primary"
                  : "font-normal text-white"
              }`}
            >
              {walletAddress}
            </span>
            <button
              onClick={handleCopy}
              className={`hover:opacity-65 cursor-pointer ${
                rebrandEnabled
                  ? "text-content-tertiary hover:text-content-primary transition-colors"
                  : "text-white"
              }`}
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
                  className={`leading-[22px] ${
                    rebrandEnabled
                      ? "text-sm  text-content-tertiary"
                      : "text-base font-normal text-content-primary/65"
                  }`}
                >
                  {date}
                </span>
                <ul className="flex flex-col gap-2">
                  {group.map((transaction, index) => (
                    <li key={index} className="flex flex-col gap-2">
                      <div
                        className={`flex gap-7 p-2.5 rounded-lg ${
                          rebrandEnabled
                            ? "bg-background-grey-light hover:bg-background-grey-light/80 transition-colors"
                            : "bg-[#3b3d48]"
                        }`}
                      >
                        <div className="relative flex items-center">
                          <Image
                            src={transaction.firstAsset?.icon || defaultImage}
                            alt={`${transaction.firstAsset.symbol} icon`}
                            className={
                              rebrandEnabled
                                ? "w-8 h-8 rounded-full border-2 border-background-secondary"
                                : "w-7 h-7"
                            }
                            width={rebrandEnabled ? 32 : 28}
                            height={rebrandEnabled ? 32 : 28}
                          />
                          <Image
                            src={transaction.secondAsset?.icon || defaultImage}
                            alt={`${transaction.secondAsset.name} icon`}
                            className={
                              rebrandEnabled
                                ? "w-8 h-8 rounded-full border-2 border-background-secondary absolute -right-3 z-10"
                                : "w-7 h-7 absolute top-0 left-5 z-10"
                            }
                            width={rebrandEnabled ? 32 : 28}
                            height={rebrandEnabled ? 32 : 28}
                          />
                        </div>
                        <div
                          className={`flex flex-col gap-1 leading-[22px] flex-1 ${
                            rebrandEnabled
                              ? "text-sm "
                              : "text-base font-normal"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <a
                              href={`${FuelAppUrl}/tx/${transaction.tx_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${
                                rebrandEnabled
                                  ? "text-content-primary hover:text-accent-primary transition-colors "
                                  : "text-content-primary"
                              }`}
                            >
                              {transaction.name}
                            </a>
                            <div
                              className={`rounded-full ${
                                rebrandEnabled ? "w-2 h-2" : "w-3 h-3"
                              } ${
                                transaction.withdrawal
                                  ? "bg-accent-warning"
                                  : transaction.addLiquidity
                                    ? "bg-content-positive"
                                    : rebrandEnabled
                                      ? "bg-accent-primary"
                                      : ""
                              }`}
                            ></div>
                          </div>
                          <span
                            className={`${
                              rebrandEnabled
                                ? "text-content-tertiary text-xs"
                                : "text-content-primary/65"
                            }`}
                          >
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
    </div>
  );
});
