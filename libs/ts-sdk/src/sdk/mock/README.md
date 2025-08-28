# Mock SDK for Mira v2

This directory contains the mock implementation of the Mira v2 SDK, designed for testing and
development without requiring blockchain interactions.

## Overview

The mock SDK provides the same interface as the real v2 SDK while maintaining persistent state in
memory (and optionally localStorage). This enables realistic testing scenarios where users can add
positions, perform swaps, and view data that persists across function calls.

## Current Implementation Status

### ✅ Completed (Task 1)

- **Core Types**: Complete TypeScript interfaces for all mock-specific types
- **MockAccount**: Full implementation with balance management and testing utilities
- **Directory Structure**: Organized mock SDK components with proper exports
- **Basic Testing**: Comprehensive test suite for MockAccount

### 🚧 In Progress (Future Tasks)

- **MockStateManager**: Central state management (Task 2)
- **MockTransactionProcessor**: Transaction simulation (Task 4)
- **MockMiraAmmV2**: Write operations interface (Task 7)
- **MockReadonlyMiraAmmV2**: Read operations interface (Task 8)

## Usage

### Basic Account Management

```typescript
import {MockAccount} from "mira-dex-ts/mock";

// Create account with test balances
const account = MockAccount.createWithTestBalances();

// Or create with custom balances
const customAccount = new MockAccount("0x123...", {
  "0x000...": new BN("1000000000000000000"), // 1 ETH
  "0x001...": new BN("1000000000"), // 1000 USDC
});

// Check balances
console.log(account.getBalance("0x000...").toString());

// Update balances
account.addBalance("0x000...", new BN("500000000000000000")); // Add 0.5 ETH
account.subtractBalance("0x001...", new BN("100000000")); // Remove 100 USDC
```

### Configuration

```typescript
import {MockSDKConfig, DEFAULT_MOCK_CONFIG} from "mira-dex-ts/mock";

const config: MockSDKConfig = {
  ...DEFAULT_MOCK_CONFIG,
  enablePersistence: true,
  defaultFailureRate: 0.1, // 10% failure rate for testing
  defaultLatencyMs: 500,
};
```

## Key Features

### 1. **Realistic Balance Management**

- Support for multiple asset types
- Automatic balance validation
- Error handling for insufficient funds

### 2. **Comprehensive Testing**

- Factory methods for test accounts
- Configurable scenarios
- Full test coverage

### 3. **Type Safety**

- Complete TypeScript interfaces
- Matches real SDK types exactly
- Compile-time validation

### 4. **Extensible Design**

- Modular architecture
- Easy to add new features
- Configurable behavior

## Development

### Running Tests

```bash
# Run all mock SDK tests
nx test ts-sdk --run MockAccount.test.ts

# Run specific test file
nx test ts-sdk --run src/sdk/mock/__tests__/MockAccount.test.ts
```

### Adding New Components

When implementing new mock components:

1. Create the implementation file in `/mock/`
2. Add comprehensive TypeScript interfaces in `types.ts`
3. Export from `index.ts`
4. Create corresponding test file in `__tests__/`
5. Update this README with usage examples

## Architecture

```
mock/
├── index.ts                 # Main exports
├── types.ts                 # TypeScript interfaces
├── MockAccount.ts           # ✅ Account management
├── MockStateManager.ts      # 🚧 State persistence
├── MockTransactionProcessor.ts # 🚧 Transaction simulation
├── MockMiraAmmV2.ts        # 🚧 Write operations
├── MockReadonlyMiraAmmV2.ts # 🚧 Read operations
├── __tests__/              # Test files
└── README.md               # This file
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.1**: Same interface as real v2 SDK ✅
- **Requirement 1.2**: Realistic mock data without blockchain calls ✅
- **Requirement 1.3**: In-memory state management setup ✅

## Next Steps

The next tasks will implement:

1. **Task 2**: MockStateManager for persistent state management
2. **Task 3**: MockPoolState and MockBinState data structures
3. **Task 4**: MockTransactionProcessor for realistic transaction simulation
4. And so on...

Each task builds incrementally on the foundation established in Task 1.
