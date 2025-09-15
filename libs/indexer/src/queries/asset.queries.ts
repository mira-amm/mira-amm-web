import {gql} from "graphql-request";

export const GET_ASSET_BY_ID = gql`
  query GetAssetById($id: String!) {
    asset: assetById(id: $id) {
      id
      name
      symbol
      decimals
      price
    }
  }
`;

export const GET_ASSET_PRICE = gql`
  query GetAssetPrice($id: String!) {
    asset: assetById(id: $id) {
      price
    }
  }
`;

export const GET_ASSETS_LIST = gql`
  query GetAssets {
    assets(orderBy: symbol_ASC) {
      id
      name
      symbol
      decimals
      price
      metadata
    }
  }
`;

export const GET_ASSETS_WITH_POOLS = gql`
  query GetAssetsWithPools {
    assets(where: {numPools_gt: 0}) {
      image
      name
      symbol
      id
      decimals
      numPools
      l1Address
      price
      contractId
      subId
    }
  }
`;

export const GET_ASSET_METADATA = gql`
  query GetAssetMetadata($id: String!) {
    asset: assetById(id: $id) {
      id
      name
      symbol
      decimals
      metadata
    }
  }
`;

export const GET_ASSET_IMAGE = gql`
  query GetAssetImage($id: String!) {
    asset: assetById(id: $id) {
      id
      metadata
    }
  }
`;

export const SEARCH_ASSETS = gql`
  query SearchAssets($query: String!, $limit: Int = 10) {
    assets(
      where: {
        OR: [
          {name_contains_insensitive: $query}
          {symbol_contains_insensitive: $query}
        ]
      }
      limit: $limit
      orderBy: symbol_ASC
    ) {
      id
      name
      symbol
      decimals
      price
    }
  }
`;
