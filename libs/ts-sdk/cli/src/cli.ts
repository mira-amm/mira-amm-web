import {Command} from "commander";
import {cleanEnv, str} from "envalid";

import {
  Address,
  formatUnits,
  Provider,
  TransactionRequestLike,
  TxParams,
  WalletUnlocked,
} from "fuels";

import {buildPoolId, getAssetId, MiraAmm, ReadonlyMiraAmm} from "mira-dex-ts";

import {futureDeadline} from "./utils";

const FALLBACK_RPC = "https://testnet.fuel.network/v1/graphql";

const {SECRET_KEY, RPC, CONTRACT_ADDRESS} = cleanEnv(process.env, {
  SECRET_KEY: str({default: ""}),
  CONTRACT_ADDRESS: str({
    default:
      "0x2E40F2b244B98ed6B8204B3De0156C6961f98525c8162f80162fCF53EEBd90E7",
  }),
  RPC: str({default: FALLBACK_RPC}),
});

const program = new Command();

const provider = new Provider(RPC);
const wallet = new WalletUnlocked(SECRET_KEY, provider);
const mira = new MiraAmm(wallet, CONTRACT_ADDRESS);
const readonlyMira = new ReadonlyMiraAmm(provider, CONTRACT_ADDRESS);

const txParams: TxParams = {
  gasLimit: 999_999,
  maxFee: 999_999,
};

async function send(request: TransactionRequestLike, operation: string) {
  const tx = await wallet.sendTransaction(request, {
    estimateTxDependencies: true,
  });
  await tx.waitForResult();
  console.log(operation, tx.id);
}

program
  .command(
    "create-pool-and-add-liquidity isStable tokenAContract tokenASubId tokenBContract tokenBSubId amountA amountB"
  )
  .action(
    async (
      isStable,
      tokenAContract,
      tokenASubId,
      tokenBContract,
      tokenBSubId,
      amountA,
      amountB
    ) => {
      isStable = isStable === "true";
      const assetA = getAssetId(tokenAContract, tokenASubId);
      const assetB = getAssetId(tokenBContract, tokenBSubId);
      const poolId = buildPoolId(assetA, assetB, isStable);

      const [
        token0Contract,
        token0SubId,
        token1Contract,
        token1SubId,
        amount0,
        amount1,
      ] =
        poolId[0].bits === assetA.bits
          ? [
              tokenAContract,
              tokenASubId,
              tokenBContract,
              tokenBSubId,
              amountA,
              amountB,
            ]
          : [
              tokenBContract,
              tokenBSubId,
              tokenAContract,
              tokenASubId,
              amountB,
              amountA,
            ];
      const deadline = await futureDeadline(provider);
      const request = await mira.createPoolAndAddLiquidity(
        token0Contract,
        token0SubId,
        token1Contract,
        token1SubId,
        isStable,
        amount0,
        amount1,
        deadline,
        txParams
      );
      await send(request, "create-pool-and-add-liquidity");
    }
  );

program
  .command(
    "create-pool isStable tokenAContract tokenASubId tokenBContract tokenBSubId"
  )
  .action(
    async (
      isStable,
      tokenAContract,
      tokenASubId,
      tokenBContract,
      tokenBSubId
    ) => {
      isStable = isStable === "true";
      const assetA = getAssetId(tokenAContract, tokenASubId);
      const assetB = getAssetId(tokenBContract, tokenBSubId);
      const poolId = buildPoolId(assetA, assetB, isStable);

      const [token0Contract, token0SubId, token1Contract, token1SubId] =
        poolId[0].bits === assetA.bits
          ? [tokenAContract, tokenASubId, tokenBContract, tokenBSubId]
          : [tokenBContract, tokenBSubId, tokenAContract, tokenASubId];

      const request = await mira.createPool(
        token0Contract,
        token0SubId,
        token1Contract,
        token1SubId,
        isStable,
        txParams
      );
      await send(request, "create-pool");
    }
  );

program
  .command("add-liquidity isStable assetA assetB amountA amountB")
  .action(async (isStable, assetA, assetB, amountA, amountB) => {
    isStable = isStable === "true";
    const poolId = buildPoolId(assetA, assetB, isStable);
    const amount0 = poolId[0].bits === assetA ? amountA : amountB;
    const amount1 = poolId[0].bits === assetA ? amountB : amountA;
    const deadline = await futureDeadline(provider);
    const request = await mira.addLiquidity(
      poolId,
      amount0,
      amount1,
      0,
      0,
      deadline,
      txParams
    );
    await send(request, "add-liquidity");
  });

program
  .command("remove-liquidity isStable assetA assetB liquidity")
  .action(async (isStable, assetA, assetB, liquidity) => {
    isStable = isStable === "true";
    const poolId = buildPoolId(assetA, assetB, isStable);
    const deadline = await futureDeadline(provider);
    const request = await mira.removeLiquidity(
      poolId,
      liquidity,
      0,
      0,
      deadline,
      txParams
    );
    await send(request, "remove-liquidity");
  });

program
  .command("swap-exact-output isStable assetA assetB maxInput output")
  .action(async (isStable, assetA, assetB, maxInput, output) => {
    isStable = isStable === "true";
    const poolId = buildPoolId(assetA, assetB, isStable);
    const deadline = await futureDeadline(provider);
    const request = await mira.swapExactOutput(
      output,
      {bits: assetB},
      maxInput,
      [poolId],
      deadline,
      txParams
    );
    await send(request, "swap-exact-output");
  });

program
  .command("pool-meta isStable assetA assetB")
  .action(async (isStable, assetA, assetB) => {
    isStable = isStable === "true";
    const poolId = buildPoolId(assetA, assetB, isStable);
    const meta = await readonlyMira.poolMetadata(poolId);
    if (meta === null) {
      console.log("Pool not found");
      return;
    }
    const lpAssetInfo = await readonlyMira.lpAssetInfo({
      bits: meta.liquidity[0].bits,
    });
    if (lpAssetInfo === null) {
      console.log("LP asset not found");
      return;
    }
    let [symbol0, symbol1] = lpAssetInfo.name.split("-", 2);
    symbol1 = symbol1.substring(0, symbol1.length - 3);

    const reserve0Decimal = parseFloat(
      formatUnits(meta.reserve0, meta.decimals0)
    );
    const reserve1Decimal = parseFloat(
      formatUnits(meta.reserve1, meta.decimals1)
    );

    console.log(
      "id:",
      meta.poolId[0].bits,
      meta.poolId[1].bits,
      meta.poolId[2]
    );
    if (meta.poolId[2]) {
      // is stable
      console.log("Stable pool, no price yet");
    } else {
      console.log(
        "price:",
        reserve0Decimal / reserve1Decimal,
        symbol0,
        "per",
        symbol1
      );
      console.log(
        "price:",
        reserve1Decimal / reserve0Decimal,
        symbol1,
        "per",
        symbol0
      );
    }
    console.log(
      "reserve0:",
      parseFloat(meta.reserve0.toString()) / Math.pow(10, meta.decimals0),
      symbol0
    );
    console.log(
      "reserve1:",
      parseFloat(meta.reserve1.toString()) / Math.pow(10, meta.decimals1),
      symbol1
    );
    console.log("liquidity:", meta.liquidity[1].toString());
    console.log("liquidity asset:", meta.liquidity[0].bits);
    console.log("decimals0:", meta.decimals0);
    console.log("decimals1:", meta.decimals1);
    console.log("lp name:", lpAssetInfo.name);
    console.log("lp symbol:", lpAssetInfo.symbol);
    console.log("lp decimals:", lpAssetInfo.decimals);
    console.log("lp total supply:", lpAssetInfo.totalSupply.toString());
  });

program.command("amm-meta").action(async () => {
  const meta = await readonlyMira.ammMetadata();
  console.log("id:", Address.fromString(meta.id).toB256());
  console.log("owner:", meta.owner);
  console.log("hook:", meta.hook);
  console.log("total assets:", meta.totalAssets.toString());
  console.log(
    "LP fees (v/s):",
    meta.fees.lpFeeVolatile.toString(),
    meta.fees.lpFeeStable.toString()
  );
  console.log(
    "Protocol fees (v/s):",
    meta.fees.protocolFeeVolatile.toString(),
    meta.fees.protocolFeeStable.toString()
  );
});

program.command("transfer-ownership newOwner").action(async (newOwner) => {
  let request = await mira.transferOwnership(newOwner, txParams);
  await send(request, "transfer-ownership");
});

program.command("set-hook contractId").action(async (contractId?) => {
  contractId = contractId == "null" ? undefined : contractId;
  let request = await mira.setHook(contractId ?? undefined, txParams);
  await send(request, "set-hook");
});

program.command("deploy").action(async () => {
  await MiraAmm.deploy(wallet);
});

program.parse();
