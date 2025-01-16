// library imports
import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {ethers} from "ethers";

// local imports
import {NetworkUrl, SQDIndexerUrl} from "@/src/utils/constants";

// interfaces
interface AssetIndexerResponse {
  l1Address: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string | number;
  circulatingSupply?: string | number;
  coinGeckoId?: string;
  coinMarketCapId?: string;
  metadata?: Record<string, string>;
}

interface Asset {
  asset: {
    id: string; // This would be `l1Address` (string type)
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string | number; // Assuming totalSupply could be string or number
  };
}

// Helper function to determine if the address is EVM-compatible
function isEVMAddress(address: string): boolean {
  // EVM addresses are 42 characters long, starting with '0x' and followed by 40 hexadecimal characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to determine if the address is a potential hash (64 characters after '0x')
function isHash(address: string): boolean {
  // A hash is 64 hexadecimal characters after '0x'
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

// Helper function to validate and return the address (checksummed for EVM)
function validateAddress(address: string): string {
  if (isEVMAddress(address)) {
    try {
      // If it's an EVM address, return the checksummed version
      console.log("is EVM address");
      return ethers.getAddress(address);
    } catch (e) {
      return address; // Return the original address if it can't be checksummed
    }
  } else if (isHash(address)) {
    // If it's a hash (64 characters long), return it as-is
    console.log("isHash");
    return address;
  } else {
    console.log("neiither evmaddress nor hash");
    // If the address doesn't match either format, return it as-is
    return address;
  }
}

// Handle GET requests for /api/asset
export async function GET(req: Request) {
  // Extract the 'id' query parameter from the URL
  const url = new URL(req.url);
  const assetId = url.searchParams.get("id");

  // Return a 400 error if no 'id' is provided
  if (!assetId) {
    return NextResponse.json({error: "Asset ID is required"}, {status: 400});
  }

  try {
    /*********************************************
    
     *  QUESTION 1:
     *  The following fields are not included in the Next response:
     *    - circulatingSupply?: string | number;
          - coinGeckoId?: string;
          - coinMarketCapId?: string;
          - metadata?: Record<string, string>;
     *  commented out code for now , will add once clear on the schema

     *  QUESTION 2:
     *  Do we need to do checksum or backend/indexer already does it (also if yes, suggest library to do that; currently trying ethers)
     *  commented out code for now
     
     *  QUESTION 3:
     *  Here querying SQDIndexer endpoint since networkUrl schema has coin/coins as opposed to assets 
        and I am not aware of the GQL schema to query
     *  Would appreciate any help/insights!

     *  QUESTION 4:
     *  is l1Address the asset address or something else. Some cases , l1Address is coming as null
     *********************************************/

    // GraphQL query to fetch asset details
    const query = gql`
      query GetAsset($id: String!) {
        assetById(id: $id) {
          l1Address
          decimals
          name
          supply
          symbol
        }
      }
    `;

    // Send the GraphQL request to the indexer server
    const data = await request<{assetById: AssetIndexerResponse}>({
      url: SQDIndexerUrl,
      document: query,
      variables: {id: assetId}, // Use 'id' as a query variable
    });

    // Extract asset data from the response
    const asset = data.assetById;

    // Return 404 if the asset is not found
    if (!asset) {
      return NextResponse.json({error: "Asset not found"}, {status: 404});
    }

    // Ensure the asset ID (contract address) is valid
    const isValidAddress = validateAddress(asset.l1Address);

    if (!isValidAddress) {
      return NextResponse.json(
        {error: "L1 Address is invalid for the requested asset"},
        {status: 422},
      );
    }

    // Transforming to desired format for Gecko Terminal
    const transformedAsset: Asset = {
      asset: {
        id: asset.l1Address,
        name: asset.name,
        symbol: asset.symbol,
        decimals: asset.decimals,
        totalSupply: asset.supply, // Rename supply to totalSupply
      },
    };

    return NextResponse.json(transformedAsset);
  } catch (error) {
    console.error("Error fetching asset data:", error);
    return NextResponse.json(
      {error: "Failed to fetch asset data"},
      {status: 500},
    );
  }
}
