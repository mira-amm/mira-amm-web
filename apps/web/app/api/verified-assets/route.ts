import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

// Server-side provider interfaces
interface IServerVerifiedAssetsProvider {
  getVerifiedAssets(): Promise<any[]>;
}

class FileVerifiedAssetsProvider implements IServerVerifiedAssetsProvider {
  constructor(private filePath: string) {}

  async getVerifiedAssets(): Promise<any[]> {
    const fileContents = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(fileContents);
  }
}

class RemoteVerifiedAssetsProvider implements IServerVerifiedAssetsProvider {
  constructor(private apiUrl: string) {}

  async getVerifiedAssets(): Promise<any[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch verified assets: ${response.statusText}`);
    }
    return response.json();
  }
}

class FallbackVerifiedAssetsProvider implements IServerVerifiedAssetsProvider {
  constructor(private providers: IServerVerifiedAssetsProvider[]) {}

  async getVerifiedAssets(): Promise<any[]> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        return await provider.getVerifiedAssets();
      } catch (error) {
        lastError = error as Error;
        console.debug('Provider failed, trying next:', error);
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }
}

function createServerVerifiedAssetsProvider(): IServerVerifiedAssetsProvider {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const explicitPath = process.env.VERIFIED_ASSETS_PATH;

  if (explicitPath) {
    return new FileVerifiedAssetsProvider(explicitPath);
  }

  if (isDevelopment) {
    // Local development: try indexer file first, then remote as fallback
    return new FallbackVerifiedAssetsProvider([
      new FileVerifiedAssetsProvider(join(process.cwd(), '../indexer/public/verified-assets.json')),
      new RemoteVerifiedAssetsProvider('https://verified-assets.fuel.network/assets.json'),
    ]);
  } else {
    // Production: try remote first, then any bundled assets
    return new FallbackVerifiedAssetsProvider([
      new RemoteVerifiedAssetsProvider('https://verified-assets.fuel.network/assets.json'),
      new FileVerifiedAssetsProvider(join(process.cwd(), 'public/verified-assets.json')),
    ]);
  }
}

export async function GET() {
  try {
    const provider = createServerVerifiedAssetsProvider();
    const assetsData = await provider.getVerifiedAssets();

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(assetsData, {
      headers: {
        // Cache for 1 hour in development, 24 hours in production
        'Cache-Control': isDevelopment 
          ? 'public, max-age=3600, stale-while-revalidate=1800' 
          : 'public, max-age=86400, stale-while-revalidate=3600',
        'ETag': `"${Buffer.from(JSON.stringify(assetsData)).toString('base64').slice(0, 16)}"`,
      },
    });
  } catch (error) {
    console.error('Failed to load verified assets:', error);
    return NextResponse.json(
      { error: 'Failed to load verified assets' },
      { status: 500 }
    );
  }
}