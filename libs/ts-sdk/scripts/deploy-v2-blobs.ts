/**
 * Deploy V2 script bytecode as blobs on-chain
 *
 * This script deploys the V2 script bytecode (SwapExactIn, SwapExactOut, AddLiquidity, RemoveLiquidity)
 * as blobs on the Fuel network. Once deployed, loader scripts can reference these blobs by their IDs,
 * reducing transaction size from ~10-12KB to ~400 bytes per transaction.
 *
 * Usage:
 *   # Dry run (calculate blob IDs without deploying)
 *   npx tsx scripts/deploy-v2-blobs.ts --dry-run
 *
 *   # Deploy to testnet
 *   PRIVATE_KEY=0x... npx tsx scripts/deploy-v2-blobs.ts
 *
 *   # Deploy to mainnet
 *   PRIVATE_KEY=0x... PROVIDER_URL=https://mainnet.fuel.network/v1/graphql npx tsx scripts/deploy-v2-blobs.ts
 *
 * Environment variables:
 *   PRIVATE_KEY - Private key of the wallet to use for deployment (not required for dry-run)
 *   PROVIDER_URL - Fuel network provider URL (default: testnet)
 *
 * Options:
 *   --dry-run    Calculate blob IDs without deploying (no wallet required)
 */

import {Provider, Wallet, sha256} from "fuels";
import {
  AddLiquidity,
  RemoveLiquidity,
  SwapExactIn,
  SwapExactOut,
} from "../src/sdk/typegen/scripts-v2";

interface ScriptClass {
  new (wallet: any): any;
  bytecode: Uint8Array;
}

interface ScriptInfo {
  name: string;
  Script: ScriptClass;
}

const scripts: ScriptInfo[] = [
  {name: "SwapExactIn", Script: SwapExactIn},
  {name: "SwapExactOut", Script: SwapExactOut},
  {name: "AddLiquidity", Script: AddLiquidity},
  {name: "RemoveLiquidity", Script: RemoveLiquidity},
];

function calculateBlobIds(): Record<string, {blobId: string; size: number}> {
  const result: Record<string, {blobId: string; size: number}> = {};

  for (const {name, Script} of scripts) {
    const blobId = sha256(Script.bytecode);
    result[name] = {blobId, size: Script.bytecode.length};
  }

  return result;
}

function printBlobIds(
  blobData: Record<string, {blobId: string; size: number}>,
  network: string
) {
  console.log("\n=== Blob IDs ===\n");

  for (const [name, {blobId, size}] of Object.entries(blobData)) {
    console.log(`${name}:`);
    console.log(`  Blob ID: ${blobId}`);
    console.log(`  Bytecode size: ${size} bytes`);
    console.log("");
  }

  console.log("=== Copy to constants.ts ===\n");
  console.log(`export const V2_SCRIPT_BLOB_IDS = {`);
  console.log(`  ${network}: {`);
  for (const [name, {blobId}] of Object.entries(blobData)) {
    const camelCaseName = name.charAt(0).toLowerCase() + name.slice(1);
    console.log(`    ${camelCaseName}: "${blobId}",`);
  }
  console.log(`  },`);
  console.log(`};`);

  console.log("\n=== JSON Output ===\n");
  const jsonOutput: Record<string, string> = {};
  for (const [name, {blobId}] of Object.entries(blobData)) {
    jsonOutput[name] = blobId;
  }
  console.log(JSON.stringify(jsonOutput, null, 2));
}

async function dryRun() {
  console.log("=== DRY RUN MODE ===");
  console.log("Calculating blob IDs without deploying...\n");

  const blobData = calculateBlobIds();
  printBlobIds(blobData, "testnet");

  console.log("\n=== Transaction Size Savings ===\n");
  const loaderSize = 400; // approximate loader script size
  for (const [name, {size}] of Object.entries(blobData)) {
    const savings = size - loaderSize;
    const percent = ((savings / size) * 100).toFixed(1);
    console.log(
      `${name}: ${size} bytes -> ~${loaderSize} bytes (${percent}% reduction)`
    );
  }
}

async function deploy() {
  const privateKey = process.env.PRIVATE_KEY;
  const providerUrl =
    process.env.PROVIDER_URL || "https://testnet.fuel.network/v1/graphql";

  if (!privateKey) {
    console.error("Error: PRIVATE_KEY environment variable is required");
    console.error("");
    console.error("Usage:");
    console.error("  # Dry run (no wallet required):");
    console.error("  npx tsx scripts/deploy-v2-blobs.ts --dry-run");
    console.error("");
    console.error("  # Deploy to testnet:");
    console.error("  PRIVATE_KEY=0x... npx tsx scripts/deploy-v2-blobs.ts");
    process.exit(1);
  }

  console.log(`Connecting to provider: ${providerUrl}`);
  const provider = new Provider(providerUrl);
  const wallet = Wallet.fromPrivateKey(privateKey, provider);

  const balance = await wallet.getBalance();
  console.log(`Wallet address: ${wallet.address.toB256()}`);
  console.log(`Wallet balance: ${balance.toString()} base units`);

  if (balance.isZero()) {
    console.error(
      "Error: Wallet has no balance. Please fund the wallet first."
    );
    process.exit(1);
  }

  // Determine network name for output
  const network = providerUrl.includes("testnet") ? "testnet" : "mainnet";

  console.log("\n=== Deploying V2 Script Blobs ===\n");

  const deployedBlobs: Record<string, {blobId: string; size: number}> = {};

  for (const {name, Script} of scripts) {
    console.log(`Deploying ${name}...`);
    console.log(`  Bytecode size: ${Script.bytecode.length} bytes`);

    // Calculate blob ID for reference
    const blobId = sha256(Script.bytecode);
    console.log(`  Blob ID: ${blobId}`);

    try {
      // Create script instance and deploy as blob
      const script = new Script(wallet);

      // Use the Script.deploy() method which handles blob deployment
      const {blobId: deployedBlobId, waitForResult} = await script.deploy(wallet);

      console.log(`  Deploying... (blob ID: ${deployedBlobId})`);

      // Wait for the deployment transaction to complete
      const loaderScript = await waitForResult();

      console.log(`  Status: SUCCESS`);
      console.log(`  Loader script ready`);

      deployedBlobs[name] = {blobId: deployedBlobId, size: Script.bytecode.length};
    } catch (error: any) {
      const errorMsg = error?.message || String(error);

      // Check if blob already exists
      if (
        errorMsg.includes("BlobIdAlreadyUploaded") ||
        errorMsg.includes("already exists") ||
        errorMsg.includes("Blob already uploaded")
      ) {
        console.log(`  Blob already exists on-chain`);
        deployedBlobs[name] = {blobId, size: Script.bytecode.length};
      } else {
        console.error(`  Error: ${errorMsg}`);
      }
    }

    console.log("");
  }

  printBlobIds(deployedBlobs, network);
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("-n");

  if (isDryRun) {
    await dryRun();
  } else {
    await deploy();
  }
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
