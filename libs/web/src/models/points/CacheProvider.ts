import {put, del, list} from "@vercel/blob";
import fs from "fs/promises";
import {PointsResponse} from "@/src/models/points/interfaces";

export interface CacheEntry {
  expiresAt: string;
  points: PointsResponse[];
}

export type CacheData = Map<number | "TOTAL", CacheEntry>;

export interface CacheProvider {
  read(): Promise<CacheData>;
  write(data: CacheData): Promise<void>;
}

export interface CacheProviderConfig {
  localFilePath?: string;
  blobId?: string;
  environment?: string;
}

export class LocalFileCacheProvider implements CacheProvider {
  constructor(private readonly filePath: string) {}

  async read(): Promise<CacheData> {
    try {
      const points = await fs.readFile(this.filePath, "utf8");
      const rawData = JSON.parse(points) as Record<string, CacheEntry>;
      
      // Convert the object to a Map
      const data = new Map<number | "TOTAL", CacheEntry>();
      
      // Validate and convert each entry
      for (const [key, value] of Object.entries(rawData)) {
        if (!value.expiresAt || !Array.isArray(value.points)) {
          throw new Error(`Invalid cache data structure for key ${key}`);
        }
        
        // Convert string keys to numbers where possible
        const mapKey = key === "TOTAL" ? "TOTAL" : Number(key);
        if (mapKey !== "TOTAL" && isNaN(mapKey)) {
          throw new Error(`Invalid key in cache: ${key}`);
        }
        
        data.set(mapKey, value);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read cache: ${error.message}`);
      }
      throw error;
    }
  }

  async write(data: CacheData): Promise<void> {
    try {
      // Convert Map to object for JSON serialization
      const serializableData = Object.fromEntries(data);
      await fs.writeFile(this.filePath, JSON.stringify(serializableData));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to write cache: ${error.message}`);
      }
      throw error;
    }
  }
}

export class VercelBlobCacheProvider implements CacheProvider {
  constructor(private readonly blobId: string) {}

  private getEnvironmentPrefix(): string {
    const env = process.env.VERCEL_ENV || "development";
    return `${env}-`;
  }

  private getFullBlobId(): string {
    return `${this.getEnvironmentPrefix()}${this.blobId}`;
  }

  async read(): Promise<CacheData> {
    try {
      const {blobs} = await list({prefix: this.getFullBlobId()});
      if (blobs.length === 0) {
        throw new Error("No data found");
      }

      // Get the most recent blob
      const latestBlob = blobs[0];
      const response = await fetch(latestBlob.url);
      const rawData = await response.json() as Record<string, CacheEntry>;
      
      // Convert the object to a Map
      const data = new Map<number | "TOTAL", CacheEntry>();
      
      // Validate and convert each entry
      for (const [key, value] of Object.entries(rawData)) {
        if (!value.expiresAt || !Array.isArray(value.points)) {
          throw new Error(`Invalid cache data structure for key ${key}`);
        }
        
        // Convert string keys to numbers where possible
        const mapKey = key === "TOTAL" ? "TOTAL" : Number(key);
        if (mapKey !== "TOTAL" && isNaN(mapKey)) {
          throw new Error(`Invalid key in cache: ${key}`);
        }
        
        data.set(mapKey, value);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read cache: ${error.message}`);
      }
      throw error;
    }
  }

  async write(data: CacheData): Promise<void> {
    try {
      // Delete any existing blobs with the same ID
      const {blobs} = await list({prefix: this.getFullBlobId()});
      await Promise.all(blobs.map((blob) => del(blob.url)));

      // Convert Map to object for JSON serialization
      const serializableData = Object.fromEntries(data);
      
      // Upload the new data
      await put(this.getFullBlobId(), JSON.stringify(serializableData), {
        access: "public",
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to write cache: ${error.message}`);
      }
      throw error;
    }
  }
}

// Cached locally in development, cached in Vercel Blobs in production
// This allows cache to be persisted between deployments
export function createCacheProvider(
  config: CacheProviderConfig = {},
): CacheProvider {
  const {
    localFilePath = "/tmp/latestPoints.json",
    blobId = "latestPoints",
    environment = process.env.NODE_ENV,
  } = config;

  if (environment === "development") {
    return new LocalFileCacheProvider(localFilePath);
  }
  return new VercelBlobCacheProvider(blobId);
}
