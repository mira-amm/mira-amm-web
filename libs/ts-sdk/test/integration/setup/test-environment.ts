import {Provider, WalletUnlocked} from "fuels";
import {spawn, ChildProcess} from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Test environment configuration
 */
export const TEST_CONFIG = {
  fuelNode: {
    url: "http://localhost:4000/v1/graphql",
    port: 4000,
  },
  indexer: {
    url: "http://localhost:4350/graphql",
    port: 4350,
  },
  contracts: {
    // Will be loaded from contract-ids.json
    basicHook: "",
    poolCurveState: "",
    simpleProxy: "",
    fungible: "",
  },
  defaultSigner: {
    privateKey:
      "0xa449b1ffee0e2205fa924c6740cc48b3b473aa28587df6dab12abc245d1f5298",
    address:
      "0x94ffcc53b892684acefaebc8a3d4a595e528a8cf664eeb3ef36f1020b0809d0d",
  },
  timeout: {
    nodeStartup: 30000,
    indexerStartup: 30000,
    transactionConfirmation: 10000,
  },
};

/**
 * Test environment manager for integration tests
 */
export class TestEnvironment {
  private nodeProcess?: ChildProcess;
  private indexerProcess?: ChildProcess;
  private provider?: Provider;
  private wallet?: WalletUnlocked;
  private isInitialized = false;

  constructor() {
    this.loadContractIds();
  }

  /**
   * Load contract IDs from the deployed contracts file
   */
  private loadContractIds() {
    try {
      // Find project root by looking for package.json with workspace info
      let currentDir = __dirname;
      while (
        currentDir !== "/" &&
        !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
      ) {
        currentDir = path.dirname(currentDir);
      }

      const contractIdsPath = path.join(
        currentDir,
        "apps/indexer/mira-binned-liquidity-api/contract-ids.json"
      );
      const contractIds = JSON.parse(fs.readFileSync(contractIdsPath, "utf8"));
      TEST_CONFIG.contracts = contractIds;
    } catch (error) {
      console.warn("Could not load contract IDs, using defaults:", error);
    }
  }

  /**
   * Start the test environment (node and indexer)
   */
  async start(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("🚀 Starting test environment...");

    // Check if services are already running
    const nodeRunning = await this.isServiceRunning(TEST_CONFIG.fuelNode.url);
    const indexerRunning = await this.isServiceRunning(TEST_CONFIG.indexer.url);

    if (!nodeRunning) {
      throw new Error(
        "Fuel node not running. Please start them first with: pnpm nx dev indexer\n" +
          "Or use the integration test script: pnpm nx test:integration ts-sdk"
      );
    }

    if (!indexerRunning) {
      console.log("⚠️  Indexer not running, some tests may be skipped");
    }

    console.log("✅ Services already running");

    await this.initializeProvider();
    this.isInitialized = true;
    console.log("✅ Test environment ready");
  }

  /**
   * Start node and indexer services
   */
  private async startServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Starting node and indexer via nx dev indexer...");

      // Start the services using nx
      this.nodeProcess = spawn("pnpm", ["nx", "dev", "indexer"], {
        cwd: path.join(__dirname, "../../../../../.."),
        stdio: "pipe",
        shell: true,
      });

      let nodeReady = false;
      let indexerReady = false;
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for services to start"));
      }, TEST_CONFIG.timeout.nodeStartup + TEST_CONFIG.timeout.indexerStartup);

      const checkReady = () => {
        if (nodeReady && indexerReady) {
          clearTimeout(timeout);
          resolve();
        }
      };

      // Monitor output for readiness
      this.nodeProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log("[NODE/INDEXER]", output.trim());

        if (output.includes("Fuel node started") || output.includes("4000")) {
          nodeReady = true;
          checkReady();
        }

        if (output.includes("Indexer started") || output.includes("4350")) {
          indexerReady = true;
          checkReady();
        }
      });

      this.nodeProcess.stderr?.on("data", (data) => {
        console.error("[NODE/INDEXER ERROR]", data.toString());
      });

      this.nodeProcess.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Fallback: poll for services
      const pollInterval = setInterval(async () => {
        if (
          !nodeReady &&
          (await this.isServiceRunning(TEST_CONFIG.fuelNode.url))
        ) {
          nodeReady = true;
          console.log("✅ Fuel node detected");
          checkReady();
        }

        if (
          !indexerReady &&
          (await this.isServiceRunning(TEST_CONFIG.indexer.url))
        ) {
          indexerReady = true;
          console.log("✅ Indexer detected");
          checkReady();
        }

        if (nodeReady && indexerReady) {
          clearInterval(pollInterval);
        }
      }, 2000);
    });
  }

  /**
   * Check if a service is running
   */
  private async isServiceRunning(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: "{ __typename }",
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize provider and wallet
   */
  private async initializeProvider(): Promise<void> {
    this.provider = new Provider(TEST_CONFIG.fuelNode.url);
    this.wallet = new WalletUnlocked(
      TEST_CONFIG.defaultSigner.privateKey,
      this.provider
    );

    // Wait for the wallet to have some balance
    await this.ensureWalletFunded();
  }

  /**
   * Ensure the test wallet has funds
   */
  private async ensureWalletFunded(): Promise<void> {
    if (!this.wallet) return;

    const balance = await this.wallet.getBalance();
    if (balance.eq(0)) {
      console.log("⏳ Waiting for wallet to be funded...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const newBalance = await this.wallet.getBalance();
      if (newBalance.eq(0)) {
        throw new Error(
          "Test wallet has no funds. Ensure the node is configured correctly."
        );
      }
    }
    console.log(`💰 Wallet balance: ${balance.format()}`);
  }

  /**
   * Get the provider instance
   */
  getProvider(): Provider {
    if (!this.provider) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.provider;
  }

  /**
   * Get the default wallet instance
   */
  getWallet(): WalletUnlocked {
    if (!this.wallet) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.wallet;
  }

  /**
   * Create a new funded wallet
   */
  async createWallet(initialBalance?: string): Promise<WalletUnlocked> {
    if (!this.provider || !this.wallet) {
      throw new Error("Test environment not initialized. Call start() first.");
    }

    const newWallet = WalletUnlocked.generate({provider: this.provider});

    if (initialBalance) {
      // Transfer funds from default wallet
      const tx = await this.wallet.transfer(newWallet.address, initialBalance);
      await tx.waitForResult();
    }

    return newWallet;
  }

  /**
   * Get contract IDs
   */
  getContractIds() {
    return TEST_CONFIG.contracts;
  }

  /**
   * Get test configuration
   */
  getConfig() {
    return TEST_CONFIG;
  }

  /**
   * Stop the test environment
   */
  async stop(): Promise<void> {
    console.log("🛑 Stopping test environment...");

    if (this.nodeProcess) {
      this.nodeProcess.kill();
      this.nodeProcess = undefined;
    }

    if (this.indexerProcess) {
      this.indexerProcess.kill();
      this.indexerProcess = undefined;
    }

    this.provider = undefined;
    this.wallet = undefined;
    this.isInitialized = false;

    console.log("✅ Test environment stopped");
  }

  /**
   * Wait for a transaction to be indexed
   */
  async waitForIndexer(txId: string, maxWait = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        const response = await fetch(TEST_CONFIG.indexer.url, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            query: `
              query GetTransaction($id: String!) {
                transaction(id: $id) {
                  id
                  blockNumber
                }
              }
            `,
            variables: {id: txId},
          }),
        });

        const data = await response.json();
        if (data.data?.transaction) {
          return;
        }
      } catch {
        // Ignore errors and retry
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timeout waiting for transaction ${txId} to be indexed`);
  }
}

// Singleton instance
export const testEnvironment = new TestEnvironment();
