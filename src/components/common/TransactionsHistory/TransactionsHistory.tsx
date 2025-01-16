import React, {forwardRef, useMemo} from "react";
import styles from "./TransactionsHistory.module.css";
import {TransactionsCloseIcon} from "../../icons/Close/TransactionsCloseIcon";
import CopyAddressIcon from "../../icons/Copy/CopyAddressIcon";
import {useIsConnected, useAccount} from "@fuels/react";
import useFormattedAddress from "@/src/hooks/useFormattedAddress/useFormattedAddress";
import useWalletTransactions, {
  TransactionsData,
} from "@/src/hooks/useWalletTransactions";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultLocale} from "@/src/utils/constants";

interface TransactionProps {
  date: string;
  firstAssetIcon: string;
  secondAssetIcon: string;
  name: string;
  firstAssetAmount: string;
  secondAssetAmount: string;
  firstAssetName: string;
  secondAssetName: string;
  withdrawal?: boolean;
  addLiquidity?: boolean;
}

interface TransactionsHistoryProps {
  onClose: () => void;
  isOpened: boolean;
}

const transformTransactionsDataAndGroupByDate = (
  transactionsData: TransactionsData | undefined,
) => {
  const grouped: Record<string, TransactionProps[]> = {};
  if (!transactionsData) {
    return grouped;
  }

  const transactions = transactionsData.Transaction.toSorted(
    (txA, txB) => txB.block_time - txA.block_time,
  );

  transactions.forEach((transaction) => {
    const date = new Date(transaction.block_time * 1000).toLocaleDateString(
      DefaultLocale,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
    const [firstAssetId, secondAssetId] = transaction.pool_id.split("_");
    const firstAssetExists = coinsConfig.has(firstAssetId);
    const secondAssetExists = coinsConfig.has(secondAssetId);
    if (!firstAssetExists || !secondAssetExists) {
      return;
    }
    const firstAssetName = coinsConfig.get(firstAssetId)?.name!;
    const secondAssetName = coinsConfig.get(secondAssetId)?.name!;

    const firstAssetIcon = coinsConfig.get(firstAssetName)?.icon!;
    const secondAssetIcon = coinsConfig.get(secondAssetName)?.icon!;
    const firstAssetDecimals = coinsConfig.get(firstAssetName)?.decimals!;
    const secondAssetDecimals = coinsConfig.get(secondAssetName)?.decimals!;
    const firstAssetIn =
      Number(transaction.asset_0_in) / 10 ** firstAssetDecimals;
    const firstAssetOut =
      Number(transaction.asset_0_out) / 10 ** firstAssetDecimals;
    const secondAssetIn =
      Number(transaction.asset_1_in) / 10 ** secondAssetDecimals;
    const secondAssetOut =
      Number(transaction.asset_1_out) / 10 ** secondAssetDecimals;

    let firstAssetAmount;
    let secondAssetAmount;
    let firstAssetNameToUse;
    let secondAssetNameToUse;
    if (transaction.transaction_type === "SWAP") {
      /*
       * As assets order is always fixed in pool_id string, as well as asset_0 and asset_1 fields, we need to determine
       * which asset is input and which is output for swap. If asset_1_out > asset_0_out, it means that we need to reverse
       * mapping of assets from pool id to the visual representation of the transaction.
       */
      const reversedAssetsOrder = secondAssetOut > firstAssetOut;
      firstAssetNameToUse = reversedAssetsOrder
        ? secondAssetName
        : firstAssetName;
      secondAssetNameToUse = reversedAssetsOrder
        ? firstAssetName
        : secondAssetName;
      const firstAssetDecimals =
        coinsConfig.get(firstAssetNameToUse)?.decimals!;
      const secondAssetDecimals =
        coinsConfig.get(secondAssetNameToUse)?.decimals!;
      const outputValue = Math.max(firstAssetOut, secondAssetOut);
      const inputValue = Math.max(firstAssetIn, secondAssetIn);
      firstAssetAmount = outputValue.toFixed(firstAssetDecimals);
      secondAssetAmount = inputValue.toFixed(secondAssetDecimals);
    } else {
      firstAssetNameToUse = firstAssetName;
      secondAssetNameToUse = secondAssetName;
      if (transaction.transaction_type === "ADD_LIQUIDITY") {
        firstAssetAmount = firstAssetIn.toFixed(firstAssetDecimals);
        secondAssetAmount = secondAssetIn.toFixed(secondAssetDecimals);
      } else {
        firstAssetAmount = firstAssetOut.toFixed(firstAssetDecimals);
        secondAssetAmount = secondAssetOut.toFixed(secondAssetDecimals);
      }
    }

    let name: string;
    if (transaction.transaction_type === "ADD_LIQUIDITY") {
      name = "Added liquidity";
    } else if (transaction.transaction_type === "REMOVE_LIQUIDITY") {
      name = "Removed liquidity";
    } else {
      name = "Swap";
    }

    const transformedTransaction: TransactionProps = {
      date,
      firstAssetIcon,
      secondAssetIcon,
      name,
      firstAssetAmount,
      secondAssetAmount,
      firstAssetName: firstAssetNameToUse,
      secondAssetName: secondAssetNameToUse,
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

const TransactionsHistory = forwardRef<
  HTMLDivElement,
  TransactionsHistoryProps
>(function TransactionsHistory({onClose, isOpened}, ref) {
  const {account} = useAccount();
  const {isConnected} = useIsConnected();
  const formattedAddress = useFormattedAddress(account);
  const walletAddress = useMemo(() => {
    if (isConnected) {
      return formattedAddress;
    }

    return "Connect Wallet";
  }, [isConnected, formattedAddress]);

  const {transactions} = useWalletTransactions(account, isOpened);
  const groupedTransactions =
    transformTransactionsDataAndGroupByDate(transactions);

  const handleCopy = () => {
    if (navigator.clipboard && account) {
      navigator.clipboard.writeText(account).then(
        () => {
          console.log("Address copied to clipboard!");
        },
        (err) => {
          console.error("Failed to copy address: ", err);
        },
      );
    }
  };

  return (
    <div className={isOpened ? styles.overlayOpened : styles.overlayClosed}>
      <div
        className={`${styles.wrapper} ${isOpened ? styles.open : styles.close}`}
        ref={ref}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Transactions History</h2>
          <button
            type="button"
            className={styles.transactionCloseButton}
            onClick={onClose}
          >
            <TransactionsCloseIcon />
          </button>
        </div>
        <div className={styles.accountInfo}>
          <div className={styles.accountUserInfo}>
            <img className={styles.accountAvatar} src="/images/avatar.png" />
            <span className={styles.accountWallet}>{walletAddress}</span>
            <button
              className={styles.copyButton}
              type="button"
              onClick={handleCopy}
            >
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
                          <img
                            src={transaction.firstAssetIcon}
                            alt={`${transaction.firstAssetName} icon`}
                          />
                        </div>
                        <div className={styles.secondCoin}>
                          <img
                            src={transaction.secondAssetIcon}
                            alt={`${transaction.secondAssetName} icon`}
                          />
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
                          {transaction.firstAssetAmount}{" "}
                          {transaction.firstAssetName}
                          {transaction.addLiquidity || transaction.withdrawal
                            ? " and "
                            : " for "}
                          {transaction.secondAssetAmount}{" "}
                          {transaction.secondAssetName}
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
      <div
        className={isOpened ? styles.linerVisible : styles.linerHidden}
      ></div>
    </div>
  );
});

export default TransactionsHistory;
