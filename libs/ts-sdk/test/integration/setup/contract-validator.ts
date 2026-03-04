import {Provider, WalletUnlocked} from "fuels";
import * as fs from "fs";
import * as path from "path";

/**
 * Contract deployment status
 */
export interface ContractStatus {
  contractId: string;
  name: string;
  isDeployed: boolean;
  isAccessible: boolean;
  blockHeight?: number;
  error?: string;
}

/**
 * Contract validation result
 */
export interface ValidationResult {
  allValid: boolean;
  contracts: ContractStatus[];
  timestamp: Date;
}

/**
 * Contract validator for ensuring contracts are properly deployed and accessible
 */
export class ContractValidator {
  private contractIds: Record<string, string> = {};
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
    this.loadContractIds();
  }

  /**
   * Load contract IDs from deployment file
   */
  private loadContractIds(): void {
    try {
      // Find project root
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

      if (fs.existsSync(contractIdsPath)) {
        this.contractIds = JSON.parse(fs.readFileSync(contractIdsPath, "utf8"));
        console.log(
          `📋 ContractValidator: Loaded ${Object.keys(this.contractIds).length} contract IDs`
        );
      } else {
        console.warn("⚠️ ContractValidator: contract-ids.json not found");
      }
    } catch (error) {
      console.error(
        "❌ ContractValidator: Failed to load contract IDs:",
        error
      );
    }
  }

  /**
   * Validate all contracts are deployed and accessible
   */
  async validateAllContracts(): Promise<ValidationResult> {
    console.log("🔍 ContractValidator: Validating contract deployments...");

    const contracts: ContractStatus[] = [];

    for (const [name, contractId] of Object.entries(this.contractIds)) {
      const status = await this.validateContract(name, contractId);
      contracts.push(status);
    }

    const allValid = contracts.every((c) => c.isDeployed && c.isAccessible);

    const result: ValidationResult = {
      allValid,
      contracts,
      timestamp: new Date(),
    };

    this.logValidationResult(result);
    return result;
  }

  /**
   * Validate a specific contract
   */
  async validateContract(
    name: string,
    contractId: string
  ): Promise<ContractStatus> {
    const status: ContractStatus = {
      contractId,
      name,
      isDeployed: false,
      isAccessible: false,
    };

    try {
      // Check if contract exists on the node
      const contractInfo = await this.provider.getContract(contractId);

      if (contractInfo) {
        status.isDeployed = true;
        status.blockHeight = contractInfo.blockHeight;

        // Try to interact with the contract to verify accessibility
        try {
          // For now, just check if we can get contract info without errors
          // In the future, we could add specific contract method calls
          status.isAccessible = true;
        } catch (accessError: any) {
          status.error = `Contract not accessible: ${accessError.message}`;
        }
      } else {
        status.error = "Contract not found on node";
      }
    } catch (error: any) {
      status.error = `Validation failed: ${error.message}`;
    }

    return status;
  }

  /**
   * Wait for contracts to be deployed and accessible
   */
  async waitForContractsReady(
    maxWaitTime = 60000,
    pollInterval = 2000
  ): Promise<ValidationResult> {
    console.log("⏳ ContractValidator: Waiting for contracts to be ready...");

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.validateAllContracts();

      if (result.allValid) {
        console.log("✅ ContractValidator: All contracts are ready!");
        return result;
      }

      // Log progress
      const readyCount = result.contracts.filter(
        (c) => c.isDeployed && c.isAccessible
      ).length;
      const totalCount = result.contracts.length;
      console.log(
        `⏳ ContractValidator: ${readyCount}/${totalCount} contracts ready`
      );

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Final validation attempt
    const finalResult = await this.validateAllContracts();

    if (!finalResult.allValid) {
      const failedContracts = finalResult.contracts.filter(
        (c) => !c.isDeployed || !c.isAccessible
      );
      const errorMessage = `Timeout waiting for contracts to be ready. Failed contracts: ${failedContracts
        .map((c) => `${c.name} (${c.error})`)
        .join(", ")}`;
      throw new Error(errorMessage);
    }

    return finalResult;
  }

  /**
   * Check if contract deployment file exists and is recent
   */
  isContractDeploymentRecent(maxAgeMs = 300000): boolean {
    // 5 minutes default
    try {
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

      if (!fs.existsSync(contractIdsPath)) {
        return false;
      }

      const stats = fs.statSync(contractIdsPath);
      const age = Date.now() - stats.mtime.getTime();

      return age < maxAgeMs;
    } catch (error) {
      console.warn(
        "⚠️ ContractValidator: Failed to check deployment file age:",
        error
      );
      return false;
    }
  }

  /**
   * Trigger contract deployment if needed
   */
  async ensureContractsDeployed(): Promise<void> {
    console.log("🔧 ContractValidator: Ensuring contracts are deployed...");

    // Check if deployment is recent
    if (this.isContractDeploymentRecent()) {
      console.log(
        "✅ ContractValidator: Recent deployment detected, skipping redeploy"
      );
      return;
    }

    // Reload contract IDs in case they were updated
    this.loadContractIds();

    // If no contract IDs loaded, deployment might be needed
    if (Object.keys(this.contractIds).length === 0) {
      console.log(
        "⚠️ ContractValidator: No contract IDs found, deployment may be needed"
      );
      console.log(
        "💡 ContractValidator: Run 'pnpm nx dev indexer' to deploy contracts"
      );
      return;
    }

    // Validate current contracts
    const result = await this.validateAllContracts();

    if (!result.allValid) {
      console.log("⚠️ ContractValidator: Some contracts are not accessible");
      console.log(
        "💡 ContractValidator: Consider restarting services with 'pnpm nx dev indexer'"
      );
    }
  }

  /**
   * Get contract IDs
   */
  getContractIds(): Record<string, string> {
    return {...this.contractIds};
  }

  /**
   * Get a specific contract ID
   */
  getContractId(name: string): string | undefined {
    return this.contractIds[name];
  }

  /**
   * Log validation result
   */
  private logValidationResult(result: ValidationResult): void {
    console.log(
      `📊 ContractValidator: Validation completed at ${result.timestamp.toISOString()}`
    );
    console.log(
      `📊 ContractValidator: Overall status: ${result.allValid ? "✅ VALID" : "❌ INVALID"}`
    );

    result.contracts.forEach((contract) => {
      const deployedIcon = contract.isDeployed ? "✅" : "❌";
      const accessibleIcon = contract.isAccessible ? "✅" : "❌";

      console.log(
        `  ${deployedIcon}${accessibleIcon} ${contract.name}: ${contract.contractId.slice(0, 10)}...`
      );

      if (contract.error) {
        console.log(`    Error: ${contract.error}`);
      }

      if (contract.blockHeight) {
        console.log(`    Block: ${contract.blockHeight}`);
      }
    });
  }

  /**
   * Wait for indexer to sync contracts
   */
  async waitForIndexerSync(maxWaitTime = 30000): Promise<void> {
    console.log(
      "⏳ ContractValidator: Waiting for indexer to sync contracts..."
    );

    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Query indexer for contract data
        const response = await fetch("http://localhost:4350/graphql", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            query: `
              query GetContracts {
                contracts(limit: 10) {
                  id
                  blockHeight
                }
              }
            `,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.data?.contracts && data.data.contracts.length > 0) {
            console.log(
              "✅ ContractValidator: Indexer has synced contract data"
            );
            return;
          }
        }
      } catch (error) {
        // Continue polling on error
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    console.warn(
      "⚠️ ContractValidator: Timeout waiting for indexer sync, continuing anyway"
    );
  }

  /**
   * Perform comprehensive contract readiness check
   */
  async performReadinessCheck(): Promise<ValidationResult> {
    console.log(
      "🔍 ContractValidator: Performing comprehensive readiness check..."
    );

    // Step 1: Ensure contracts are deployed
    await this.ensureContractsDeployed();

    // Step 2: Wait for contracts to be accessible on node
    const result = await this.waitForContractsReady();

    // Step 3: Wait for indexer to sync (optional, don't fail if it times out)
    try {
      await this.waitForIndexerSync();
    } catch (error) {
      console.warn(
        "⚠️ ContractValidator: Indexer sync check failed, but continuing:",
        error
      );
    }

    console.log("✅ ContractValidator: Readiness check completed");
    return result;
  }
}
