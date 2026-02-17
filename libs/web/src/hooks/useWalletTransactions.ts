import {gql, request} from "graphql-request";
import {useQuery} from "@tanstack/react-query";
import {B256Address} from "fuels";
import {SQDIndexerUrl} from "../utils/constants";
import {useMemo} from "react";
import {useAssetList} from "./useAssetList";

import {
  transformSubquidResponseToInternalFormat,
  transformTransactionsDataAndGroupByDate,
} from "./transform-wallet-transactions";
import type {
  TransactionsDataFromQuery,
  TransactionProps,
} from "./transform-wallet-transactions";

// Re-export types for backward compatibility
export type {
  TransactionFromQuery,
  TransactionsDataFromQuery,
  Transaction,
  TransactionsData,
  TransactionProps,
} from "./transform-wallet-transactions";

export function useWalletTransactions(
  account: B256Address | null,
  fetchCondition: boolean
): {
  transactions: Record<string, TransactionProps[]>;
  isLoading: boolean;
} {
  const {assets, isLoading: isAssetsLoading} = useAssetList();

  const query = gql`
    query MyQuery($recipient: String, $limit: Int) {
      actions(limit: $limit, where: {recipient_eq: $recipient}) {
        id
        amount0In
        amount0Out
        amount1In
        amount1Out
        type
        asset0 {
          symbol
          decimals
        }
        asset1 {
          symbol
          decimals
        }
        transaction
        recipient
        timestamp
      }
    }
  `;

  const shouldFetch = Boolean(account) && Boolean(fetchCondition);

  const {data, isLoading} = useQuery<TransactionsDataFromQuery>({
    queryKey: ["transactions", account],
    queryFn: () =>
      request({
        url: SQDIndexerUrl,
        document: query,
        variables: {
          recipient: account?.toLowerCase(),
          limit: 200,
        },
      }),
    enabled: shouldFetch,
  });

  const transactions = useMemo(() => {
    if (!data || !assets?.length) return {};

    // Transform Subquid response to internal format
    const transformedData = transformSubquidResponseToInternalFormat(
      data,
      assets
    );

    return transformTransactionsDataAndGroupByDate(transformedData, assets);
  }, [assets, data]);

  return {transactions, isLoading: isAssetsLoading || isLoading};
}
