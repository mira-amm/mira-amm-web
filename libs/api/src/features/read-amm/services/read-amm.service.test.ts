import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ReadAmmService } from './read-amm.service.js';
// import {CONTRACT_ID} from "@/shared/lib/constants"

describe('ReadAmmService', () => {
  const service = new ReadAmmService();
  const CONTRACT_ID: string = '0x2E40F2b244B98ed6B8204B3De0156C6961f98525c8162f80162fCF53EEBd90E7';

  it('should return the expected AMM contract ID', () => {
    const id = service.getId();
    assert.strictEqual(id, CONTRACT_ID);
  });

  it('should return valid AMM metadata', async () => {
    const metadata = await service.getMetadata();

    assert.ok(metadata.id, 'Expected id in metadata');
    assert.ok(metadata.fees, 'Expected fees in metadata');
    assert.ok(metadata.totalAssets, 'Expected totalAssets in metadata');
    assert.ok(Object.hasOwn(metadata, 'owner'), 'Expected owner in metadata');
    assert.ok(Object.hasOwn(metadata, 'hook'), 'Expected hook in metadata');

    assert.strictEqual(metadata.id, CONTRACT_ID);
  });
});
