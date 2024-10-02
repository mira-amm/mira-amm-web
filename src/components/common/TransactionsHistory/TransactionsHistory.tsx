import React, { useMemo } from "react";
import styles from "./TransactionsHistory.module.css";
import { TransactionsCloseIcon } from "../../icons/Close/TransactionsCloseIcon";
import CopyAddressIcon from "../../icons/Copy/CopyAddressIcon";
import { useIsConnected, useAccount } from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import useWalletTransactions, {TransactionsData} from "@/src/hooks/useWalletTransactions";
import {getAssetNameByAssetId} from "@/src/utils/common";
import {coinsConfig} from "@/src/utils/coinsConfig";

interface TransactionProps {
  date: string;
  givenIcon: React.FC;
  takenIcon: React.FC;
  name: string;
  givenSum: string;
  takenSum: string;
  givenCurrency: string;
  takenCurrency: string;
  withdrawal?: boolean;
  addLiquidity?: boolean;
}

interface TransactionsHistoryProps {
  onClose: () => void;
  isOpened: boolean;
}

const groupTransactionsByDate = (transactions: TransactionProps[]) => {
  const grouped: { [key: string]: TransactionProps[] } = {};

  transactions.forEach((transaction) => {
    if (!grouped[transaction.date]) {
      grouped[transaction.date] = [];
    }
    grouped[transaction.date].push(transaction);
  });

  return grouped;
};

const transformTransactionsDataAndGroupByDate = (transactionsData: TransactionsData | undefined) => {
  const grouped: Record<string, TransactionProps[]> = {};
  if (!transactionsData) {
    return grouped;
  }

  const transactions = transactionsData.Transaction.toSorted((txA, txB) => txB.block_time - txA.block_time);

  transactions.forEach((transaction) => {
    const date = new Date(transaction.block_time * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const [firstAssetId, secondAssetId] = transaction.pool_id.split("_");
    const firstCoin = getAssetNameByAssetId(firstAssetId);
    const secondCoin = getAssetNameByAssetId(secondAssetId);
    const firstCoinIcon = coinsConfig.get(firstCoin)?.icon!;
    const secondCoinIcon = coinsConfig.get(secondCoin)?.icon!;
    const firstCoinDecimals = coinsConfig.get(firstCoin)?.decimals!;
    const secondCoinDecimals = coinsConfig.get(secondCoin)?.decimals!;
    const firstAssetIn = Number(transaction.asset_0_in) / 10 ** firstCoinDecimals;
    const firstAssetOut = Number(transaction.asset_0_out) / 10 ** firstCoinDecimals;
    const secondAssetIn = Number(transaction.asset_1_in) / 10 ** secondCoinDecimals;
    const secondAssetOut = Number(transaction.asset_1_out) / 10 ** secondCoinDecimals;

    let givenSum;
    let takenSum;
    if (transaction.transaction_type === "SWAP") {
      const givenSumValue = Math.max(firstAssetOut, secondAssetOut);
      const takenSumValue = Math.max(firstAssetIn, secondAssetIn);
      givenSum = givenSumValue.toFixed(firstAssetOut > secondAssetOut ? firstCoinDecimals : secondCoinDecimals);
      takenSum = takenSumValue.toFixed(firstAssetIn > secondAssetIn ? firstCoinDecimals : secondCoinDecimals);
    } else if (transaction.transaction_type === "ADD_LIQUIDITY") {
      const givenSumValue = firstAssetIn;
      const takenSumValue = secondAssetIn;
      givenSum = givenSumValue.toFixed(firstCoinDecimals);
      takenSum = takenSumValue.toFixed(secondCoinDecimals);
    } else {
      const givenSumValue = firstAssetOut;
      const takenSumValue = secondAssetOut;
      givenSum = givenSumValue.toFixed(firstCoinDecimals);
      takenSum = takenSumValue.toFixed(secondCoinDecimals);
    }

    let name: string;
    if (transaction.transaction_type === "ADD_LIQUIDITY") {
      name = "Added liquidity";
    } else if (transaction.transaction_type === "REMOVE_LIQUIDITY") {
      name = "Withdrawal liquidity";
    } else {
      name = "Swap";
    }

    const transformedTransaction: TransactionProps = {
      date,
      givenIcon: firstCoinIcon,
      takenIcon: secondCoinIcon,
      name,
      givenSum,
      takenSum,
      givenCurrency: firstCoin,
      takenCurrency: secondCoin,
      withdrawal: transaction.transaction_type === "REMOVE_LIQUIDITY",
      addLiquidity: transaction.transaction_type === "ADD_LIQUIDITY",
    };

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transformedTransaction);
  });

  return grouped;
};

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({ onClose, isOpened }) => {
  const { account } = useAccount();
  const { isConnected } = useIsConnected();
  const formattedAddress = useFormattedAddress(account);
  const walletAddress = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return "Connect Wallet";
  }, [isConnected, formattedAddress]);

  const { transactions } = useWalletTransactions(account, isOpened);
  const groupedTransactions = transformTransactionsDataAndGroupByDate(transactions);

  const handleCopy = () => {
    if (navigator.clipboard && walletAddress !== "Connect Wallet") {
      navigator.clipboard.writeText(walletAddress).then(
        () => {
          console.log("Address copied to clipboard!");
        },
        (err) => {
          console.error("Failed to copy address: ", err);
        }
      );
    }
  };

  return (
    <div className={isOpened ? styles.overlayOpened : styles.overlayClosed}>
    <div className={`${styles.wrapper} ${isOpened ? styles.open : styles.close}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Transactions History</h2>
        <button type="button" className={styles.transactionCloseButton} onClick={onClose}>
          <TransactionsCloseIcon />
        </button>
      </div>
      <div className={styles.accountInfo}>
        <div className={styles.accountUserInfo}>
          <img className={styles.accountAvatar} src="/images/avatar.png" />
          <span className={styles.accountWallet}>{walletAddress}</span>
          <button className={styles.copyButton} type="button" onClick={handleCopy}>
            <CopyAddressIcon />
          </button>
        </div>
        {/*<span className={styles.accountBalance}>$4,789.06</span>*/}
      </div>
      <ul className={styles.transactionsList}>
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <li key={date} className={styles.transactionGroup}>
            <span className={styles.transactionDate}>{date}</span>
            <ul className={styles.transactions}>
              {transactions.map((transaction, index) => (
                <li key={index} className={styles.transaction}>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionCoins}>
                      <div className={styles.firstCoin}>
                        <transaction.givenIcon />
                      </div>
                      <div className={styles.secondCoin}>
                        <transaction.takenIcon />
                      </div>
                    </div>
                    <div className={styles.transactionText}>
                      <div className={styles.transactionType}>
                        <span className={styles.transactionName}>
                          {transaction.name}
                        </span>
                        <div
                          className={`${styles.typeCircle} ${
                            transaction.withdrawal
                              ? styles.withdrawal
                              : transaction.addLiquidity
                              ? styles.added
                              : ""
                          }`}
                        ></div>
                      </div>
                      <span className={styles.transactionAmount}>
                        {transaction.givenSum} {transaction.givenCurrency}
                        {transaction.addLiquidity || transaction.withdrawal ? " and " : " for "}
                        {transaction.takenSum} {transaction.takenCurrency}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
    <div className={isOpened ? styles.linerVisible : styles.linerHidden}></div>
    </div>
  );
};
