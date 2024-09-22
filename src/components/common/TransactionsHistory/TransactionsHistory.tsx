import React, { useMemo } from "react";
import styles from "./TransactionsHistory.module.css";
import { TransactionsCloseIcon } from "../../icons/Close/TransactionsCloseIcon";
import CopyAddressIcon from "../../icons/Copy/CopyAddressIcon";
import { transactionsList } from "@/src/utils/transactionsList";
import { useIsConnected, useAccount } from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";

interface TransactionProps {
  date: string;
  givenIcon: React.FC;
  takenIcon: React.FC;
  name: string;
  givenSum: number;
  takenSum: number;
  givenCurrency: string;
  takenCurrency: string;
  withdrawal?: boolean;
  taken?: boolean;
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

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({ onClose, isOpened }) => {
  const sortedTransactions = [...transactionsList].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupedTransactions = groupTransactionsByDate(sortedTransactions);

  const { account } = useAccount();
  const { isConnected } = useIsConnected();
  const formattedAddress = useFormattedAddress(account);
  const walletAddress = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return "Connect Wallet";
  }, [isConnected, formattedAddress]);

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
        <span className={styles.accountBalance}>$4,789.06</span>
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
                              : transaction.taken
                              ? styles.added
                              : ""
                          }`}
                        ></div>
                      </div>
                      <span className={styles.transactionAmount}>
                        {transaction.givenSum} {transaction.givenCurrency} for{" "}
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
