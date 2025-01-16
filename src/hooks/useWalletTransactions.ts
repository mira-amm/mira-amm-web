import {gql, request} from "graphql-request";
import {useQuery} from "@tanstack/react-query";
import {B256Address} from "fuels";
import {IndexerUrl} from "@/src/utils/constants";

export type TransactionsData = {
  Transaction: {
    initiator: B256Address;
    asset_0_in: string;
    asset_0_out: string;
    asset_1_in: string;
    asset_1_out: string;
    block_time: number;
    is_contract_initiator: boolean;
    pool_id: string;
    transaction_type: "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "SWAP";
  }[];
};

const useWalletTransactions = (
  account: B256Address | null,
  fetchCondition: boolean,
) => {
  const query = gql`
    query Transactions($owner: String, $offset: Int, $limit: Int) {
      Transaction(
        where: {initiator: {_eq: $owner}}
        offset: $offset
        limit: $limit
      ) {
        asset_0_in
        asset_0_out
        asset_1_in
        asset_1_out
        block_time
        pool_id
        transaction_type
      }
    }
  `;

  const shouldFetch = Boolean(account) && Boolean(fetchCondition);

  const {data} = useQuery({
    queryKey: ["transactions", account],
    queryFn: () =>
      request({
        url: IndexerUrl,
        document: query,
        variables: {
          owner: account?.toLowerCase(),
          limit: 200,
          offset: 0,
        },
      }),
    enabled: shouldFetch,
  });

  return {transactions: data as TransactionsData | undefined};
};

export default useWalletTransactions;
