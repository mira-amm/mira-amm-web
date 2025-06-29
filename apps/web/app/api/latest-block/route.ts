/**
 * @api {get} /latest-block Get latest block data (only if events data available for the block)
 */

import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {DateTime} from "fuels";

import {
  SQDIndexerUrl,
  NetworkUrl,
} from "../../../../../libs/web/src/utils/constants";
import {
  FuelAPIResponses,
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "@/web/shared/types";

const fetchSquidStatus = async (
  url: string,
): Promise<SQDIndexerResponses.SquidStatus> => {
  const query = gql`
    query GetSquidStatus {
      squidStatus {
        finalizedHeight
      }
    }
  `;

  const {squidStatus} = await request<{
    squidStatus: SQDIndexerResponses.SquidStatus;
  }>({
    url,
    document: query,
  });

  return squidStatus;
};

const fetchBlockByHeight = async (
  url: string,
  height: string,
): Promise<FuelAPIResponses.BlockByHeight> => {
  const query = gql`
    query GetBlockByHeight($height: String!) {
      block(height: $height) {
        header {
          time
        }
      }
    }
  `;

  const {block} = await request<{block: FuelAPIResponses.BlockByHeight}>({
    url,
    document: query,
    variables: {height},
  });

  return block;
};

export async function GET(req: NextRequest) {
  try {
    const {finalizedHeight: blockNumber} =
      await fetchSquidStatus(SQDIndexerUrl);

    const {header} = await fetchBlockByHeight(
      NetworkUrl,
      blockNumber.toString(),
    );

    const blockTimestamp = DateTime.fromTai64(
      header.time.toString(),
    ).toUnixSeconds();

    const block: GeckoTerminalQueryResponses.Block = {
      blockNumber,
      blockTimestamp,
    };

    const latestBlockResponse: GeckoTerminalQueryResponses.LatestBlockResponse =
      {block};

    return NextResponse.json(latestBlockResponse);
  } catch (error) {
    console.error("error fetching latest block:", error);
    return NextResponse.json(
      {error: "An unexpected error occurred while fetching latest block"},
      {status: 500},
    );
  }
}
