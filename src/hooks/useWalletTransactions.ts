import { gql, request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { B256Address } from "fuels";
import { IndexerUrl } from "@/src/utils/constants";

export type TransactionsData = {
  Transaction: {
    tx_id: string;
    asset_0_in: string;
    asset_0_out: string;
    asset_1_in: string;
    asset_1_out: string;
    block_time: number;
    pool_id: string;
    transaction_type: "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "SWAP";
    // is_contract_initiator: boolean;
    // initiator: B256Address;
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
        tx_id: id
        asset_0_in
        asset_0_out
        asset_1_in
        asset_1_out
        block_time
        pool_id
        transaction_type
        # is_contract_initiator
        # initiator
      }
    }
  `;

  const shouldFetch = Boolean(account) && Boolean(fetchCondition);

  const { data } = useQuery({
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

  return { transactions: data as TransactionsData | undefined };
};

export default useWalletTransactions;
/*
curl 'https://indexer.hyperindex.xyz/755fa3e/v1/graphql' \
-H 'accept: application/graphql-response+json, application/json' \
-H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
-H 'content-type: application/json' \
-H 'origin: http://localhost:3000' \
-H 'priority: u=1, i' \
-H 'referer: http://localhost:3000/' \
-H 'sec-ch-ua: "Chromium";v="133", "Not(A:Brand";v="99"' \
-H 'sec-ch-ua-mobile: ?0' \
-H 'sec-ch-ua-platform: "Linux"' \
-H 'sec-fetch-dest: empty' \
-H 'sec-fetch-mode: cors' \
-H 'sec-fetch-site: cross-site' \
-H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' \
--data - raw '{"query":"
    query Transactions {
      Transaction(
        where: {initiator: {_eq: "0xba9f1cd2305210d107f9ab4b31936c4c276c3cf47c0802f0aa5d334abfe8367b"}}
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
  ","variables":{"owner":"0xba9f1cd2305210d107f9ab4b31936c4c276c3cf47c0802f0aa5d334abfe8367b","limit":200,"offset":0},"operationName":"Transactions"}'
*/
