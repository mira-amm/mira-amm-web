import {put, del, list} from "@vercel/blob";
import fs from "fs/promises";

export interface CacheProvider {
  read(): Promise<any>;
  write(data: any): Promise<void>;
}

export class LocalFileCacheProvider implements CacheProvider {
  constructor(private readonly filePath: string) {}

  async read(): Promise<any> {
    const points = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(points);
  }

  async write(data: any): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data));
  }
}

export class VercelBlobCacheProvider implements CacheProvider {
  constructor(private readonly blobId: string) {}

  async read(): Promise<any> {
    const {blobs} = await list({prefix: this.blobId});
    if (blobs.length === 0) {
      throw new Error("No data found");
    }

    // Get the most recent blob
    const latestBlob = blobs[0];
    const response = await fetch(latestBlob.url);
    return response.json();
  }

  async write(data: any): Promise<void> {
    // Delete any existing blobs with the same ID
    const {blobs} = await list({prefix: this.blobId});
    await Promise.all(blobs.map((blob) => del(blob.url)));

    // Upload the new data
    await put(this.blobId, JSON.stringify(data), {
      access: "public",
    });
  }
}

// Cached locally in development, cached in Vercel Blobs in production
// This allows cache to be persisted between deployments
export function createCacheProvider(): CacheProvider {
  if (process.env.NODE_ENV === "development") {
    return new LocalFileCacheProvider("/tmp/latestPoints.json");
  }
  return new VercelBlobCacheProvider("latestPoints");
}
