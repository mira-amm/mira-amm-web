# V2 Mock Testing Guide

Since the v2 contracts are not yet deployed, we've implemented a comprehensive mock system to test
the v2 liquidity provision flow.

## Enabling Mock Mode

Mock mode is automatically enabled in development environments. You can also manually enable it by
setting:

```bash
NEXT_PUBLIC_ENABLE_V2_MOCK=true
```

## Mock Features

### 1. Mock Pools

- **Pool 1001**: ETH/USDC Concentrated Pool
  - Current price: 1.0
  - Price range: 0.8 - 1.2
  - 50 total bins, 12 active bins

- **Pool 1002**: BTC/ETH Concentrated Pool
  - Current price: 15.5
  - Price range: 14.0 - 17.0
  - 25 total bins, 8 active bins

### 2. Mock User Positions

- Multiple positions across different bins
- Realistic liquidity amounts and fees earned
- Mix of active and inactive bins

### 3. Mock Operations

- **Add Liquidity**: 2 second delay, returns transaction hash
- **Remove Liquidity**: 1.5 second delay, simulates bin removal
- **Fetch Positions**: 0.5 second delay, returns user positions

## Testing the Flow

### 1. Add Liquidity

1. Navigate to any pool page
2. Toggle to "Concentrated Liquidity" mode (if not auto-detected)
3. Enter amounts and click "Preview V2 Liquidity"
4. Mock transaction will simulate with realistic delay

### 2. View Positions

1. Navigate to position view for a v2 pool
2. See comprehensive position summary with:
   - Total liquidity across all bins
   - Fees earned breakdown
   - Active vs inactive bin counts
   - Individual bin details

### 3. Remove Liquidity

1. From position view, click remove liquidity
2. Select removal strategy (remove both, or single asset)
3. Mock removal simulates removing from all user bins

## Mock Indicator

When mock mode is active, you'll see a yellow indicator in the top-right corner showing "V2 Mock
Mode" with a pulsing dot.

## Configuration

Mock configuration is located in `libs/web/src/utils/mockConfig.ts` and includes:

- Pool definitions with realistic parameters
- User position data with various scenarios
- Transaction delays for realistic UX
- Mock transaction results

## Benefits

- **Full UI Testing**: Test complete user flows without contracts
- **Realistic Data**: Mock data reflects real-world scenarios
- **Performance Testing**: Simulate network delays and loading states
- **Error Handling**: Test various success/failure scenarios
- **Development Speed**: No need to wait for contract deployment

## Next Steps

Once v2 contracts are deployed:

1. Set `NEXT_PUBLIC_ENABLE_V2_MOCK=false`
2. Update hooks to use real contract calls
3. Mock system will automatically disable
4. All UI components will work with real data

The mock system is designed to be a drop-in replacement that can be easily disabled when real
contracts are available.
