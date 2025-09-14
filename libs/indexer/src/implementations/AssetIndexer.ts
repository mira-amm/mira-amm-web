import {IAssetIndexer} from "../interfaces";
import {Asset, AssetMetadata, AssetPrice} from "../types";
import {
  GET_ASSET_BY_ID,
  GET_ASSET_PRICE,
  GET_ASSETS_LIST,
  GET_ASSET_METADATA,
  GET_ASSET_IMAGE,
  SEARCH_ASSETS,
} from "../queries";

export class AssetIndexer implements IAssetIndexer {
  constructor(
    private indexer: {query: <T>(query: string, variables?: any) => Promise<T>}
  ) {}

  async getById(id: string): Promise<Asset> {
    const response = await this.indexer.query<{asset: any}>(GET_ASSET_BY_ID, {
      id,
    });

    if (!response.asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }

    return this.transformAssetData(response.asset);
  }

  async getPrice(id: string): Promise<AssetPrice> {
    const response = await this.indexer.query<{asset: {price: string}}>(
      GET_ASSET_PRICE,
      {id}
    );

    if (!response.asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }

    return {
      price: parseFloat(response.asset.price || "0"),
      timestamp: Date.now(),
      change24h: 0, // Would need additional logic to calculate
    };
  }

  async getPrices(ids: string[]): Promise<Record<string, AssetPrice>> {
    const prices: Record<string, AssetPrice> = {};

    // Note: In a real implementation, you'd want to batch this query
    // For now, we'll make individual requests
    await Promise.all(
      ids.map(async (id) => {
        try {
          prices[id] = await this.getPrice(id);
        } catch (error) {
          // Skip assets that don't have prices
          console.warn(`Failed to get price for asset ${id}:`, error);
        }
      })
    );

    return prices;
  }

  async list(): Promise<Asset[]> {
    const response = await this.indexer.query<{assets: any[]}>(GET_ASSETS_LIST);
    return response.assets.map((asset) => this.transformAssetData(asset));
  }

  async getMetadata(id: string): Promise<AssetMetadata> {
    const response = await this.indexer.query<{asset: any}>(
      GET_ASSET_METADATA,
      {id}
    );

    if (!response.asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }

    const asset = response.asset;
    const metadata = asset.metadata || {};

    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      image: metadata.image || null,
      description: metadata.description || null,
      website: metadata.website || null,
      social: {
        twitter: metadata.twitter || null,
        telegram: metadata.telegram || null,
        discord: metadata.discord || null,
      },
    };
  }

  async getImage(id: string): Promise<string | null> {
    const response = await this.indexer.query<{asset: {metadata?: any}}>(
      GET_ASSET_IMAGE,
      {id}
    );

    if (!response.asset) {
      return null;
    }

    const metadata = response.asset.metadata || {};
    return metadata.image || null;
  }

  async getBatch(ids: string[]): Promise<Asset[]> {
    // Note: In a real implementation, you'd want to batch this query
    // For now, we'll make individual requests
    const assets = await Promise.all(
      ids.map(async (id) => {
        try {
          return await this.getById(id);
        } catch (error) {
          console.warn(`Failed to get asset ${id}:`, error);
          return null;
        }
      })
    );

    return assets.filter((asset): asset is Asset => asset !== null);
  }

  async search(query: string): Promise<Asset[]> {
    const response = await this.indexer.query<{assets: any[]}>(SEARCH_ASSETS, {
      query,
      limit: 20,
    });

    return response.assets.map((asset) => this.transformAssetData(asset));
  }

  private transformAssetData(assetData: any): Asset {
    return {
      id: assetData.id,
      l1Address: assetData.l1Address,
      name: assetData.name,
      symbol: assetData.symbol,
      decimals: assetData.decimals,
      supply: assetData.supply,
      circulatingSupply: assetData.circulatingSupply,
      coinGeckoId: assetData.coinGeckoId,
      coinMarketCapId: assetData.coinMarketCapId,
      metadata: assetData.metadata,
      price: assetData.price,
    };
  }
}
