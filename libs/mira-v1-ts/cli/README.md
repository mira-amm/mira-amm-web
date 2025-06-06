# CLI

## create-pool-and-add-liquidity

```bash
pnpx vite-node src/cli.ts create-pool-and-add-liquidity <isStable> <token0Contract> <token0SubId> <token1Contract> <token1SubId> <amountA> <amountB>
```

## add-liquidity

```bash
pnpx vite-node src/cli.ts add-liquidity <isStable> <assetA> <assetB> <amountA> <amountB>
```

## remove-liquidity

```bash
pnpx vite-node src/cli.ts remove-liquidity <isStable> <assetA> <assetB> <liquidity>
```

## transfer-ownership

```bash
pnpx vite-node src/cli.ts transfer-ownership <newOwnerB256>
```

## amm-meta

```bash
pnpx vite-node src/cli.ts amm-meta
```

## pool-meta

```bash
pnpx vite-node src/cli.ts pool-meta <isStable> <assetA> <assetB>
```

## swap-exact-output

```bash
pnpx vite-node src/cli.ts swap-exact-output <isStable> <assetA> <assetB> <maxInput> <amountBOut>
```
