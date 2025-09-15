import {Asset, AssetMetadata, AssetPrice} from "../types";

export interface IAssetIndexer {
  getById(id: string): Promise<Asset>;

  getPrice(id: string): Promise<AssetPrice>;

  getPrices(ids: string[]): Promise<Record<string, AssetPrice>>;

  list(): Promise<Asset[]>;

  listWithPools(): Promise<Asset[]>;

  getMetadata(id: string): Promise<AssetMetadata>;

  getImage(id: string): Promise<string | null>;

  getBatch(ids: string[]): Promise<Asset[]>;

  search(query: string): Promise<Asset[]>;
}
