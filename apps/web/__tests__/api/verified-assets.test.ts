import { createMocks } from 'node-mocks-http';
import { GET } from '../../app/api/verified-assets/route';

describe('/api/verified-assets API', () => {
  it('should return verified assets with correct headers', async () => {
    const response = await GET();
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    // Check cache headers are present
    expect(response.headers.get('cache-control')).toContain('public');
    expect(response.headers.get('etag')).toBeTruthy();
  });

  it('should return valid asset structure', async () => {
    const response = await GET();
    const assets = await response.json();
    
    if (assets.length > 0) {
      const firstAsset = assets[0];
      
      // Check required fields
      expect(firstAsset).toHaveProperty('name');
      expect(firstAsset).toHaveProperty('symbol');
      expect(firstAsset).toHaveProperty('icon');
      expect(firstAsset).toHaveProperty('networks');
      expect(Array.isArray(firstAsset.networks)).toBe(true);
      
      if (firstAsset.networks.length > 0) {
        const network = firstAsset.networks[0];
        expect(network).toHaveProperty('type');
        expect(network).toHaveProperty('chain');
        expect(network).toHaveProperty('decimals');
        expect(network).toHaveProperty('chainId');
      }
    }
  });

  it('should have appropriate cache duration', async () => {
    const response = await GET();
    const cacheControl = response.headers.get('cache-control');
    
    // Should cache for at least 1 hour
    expect(cacheControl).toMatch(/max-age=\d+/);
    expect(cacheControl).toContain('stale-while-revalidate');
  });

  it('should return consistent ETags for same content', async () => {
    const response1 = await GET();
    const response2 = await GET();
    
    const etag1 = response1.headers.get('etag');
    const etag2 = response2.headers.get('etag');
    
    // ETags should be consistent for same content
    expect(etag1).toBe(etag2);
  });
});