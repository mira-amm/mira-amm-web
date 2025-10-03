import {spawn, ChildProcess} from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Service configuration for test environment
 */
export interface ServiceConfig {
  name: string;
  url: string;
  port: number;
  healthCheckQuery?: string;
  startupTimeout: number;
}

/**
 * Service readiness check result
 */
export interface ServiceStatus {
  name: string;
  isRunning: boolean;
  url: string;
  lastChecked: Date;
  error?: string;
}

/**
 * Service manager for handling Fuel node and indexer lifecycle
 */
export class ServiceManager {
  private services: Map<string, ServiceConfig> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor() {
    this.setupServices();
    this.setupCleanupHandlers();
  }

  /**
   * Configure default services
   */
  private setupServices(): void {
    this.services.set("fuel-node", {
      name: "Fuel Node",
      url: "http://localhost:4000/v1/graphql",
      port: 4000,
      healthCheckQuery: '{"query": "{ __typename }"}',
      startupTimeout: 30000,
    });

    this.services.set("indexer", {
      name: "Indexer",
      url: "http://localhost:4350/graphql",
      port: 4350,
      healthCheckQuery: '{"query": "{ __typename }"}',
      startupTimeout: 30000,
    });
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  private setupCleanupHandlers(): void {
    const cleanup = () => {
      if (!this.isShuttingDown) {
        this.isShuttingDown = true;
        console.log("🧹 ServiceManager: Cleaning up processes...");
        this.stopAllServices().finally(() => {
          process.exit(0);
        });
      }
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("uncaughtException", (error) => {
      console.error("❌ ServiceManager: Uncaught exception:", error);
      cleanup();
    });
  }

  /**
   * Start all required services using nx tasks
   */
  async startServices(): Promise<void> {
    console.log("🚀 ServiceManager: Starting services...");

    // Check if services are already running
    const statuses = await this.checkAllServices();
    const allRunning = statuses.every((status) => status.isRunning);

    if (allRunning) {
      console.log("♻️ ServiceManager: All services already running");
      return;
    }

    // Start services using nx dev indexer command
    await this.startServicesViaNx();

    // Wait for services to be ready
    await this.waitForServicesReady();

    // Start health monitoring
    this.startHealthMonitoring();

    console.log("✅ ServiceManager: All services started and ready");
  }

  /**
   * Start services using nx dev indexer command
   */
  private async startServicesViaNx(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔧 ServiceManager: Starting services via nx dev indexer...");

      // Find project root
      const projectRoot = this.findProjectRoot();

      const process = spawn("pnpm", ["nx", "dev", "indexer"], {
        cwd: projectRoot,
        stdio: "pipe",
        shell: true,
        detached: false,
      });

      this.processes.set("nx-dev", process);

      let nodeReady = false;
      let indexerReady = false;
      let hasResolved = false;

      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error("Timeout waiting for services to start via nx"));
        }
      }, 60000); // 60 second timeout

      const checkReady = () => {
        if (nodeReady && indexerReady && !hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          resolve();
        }
      };

      // Monitor stdout for startup indicators
      process.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log("[NX-DEV]", output.trim());

        // Look for node startup indicators
        if (
          output.includes("Fuel node started") ||
          output.includes("fuel-core") ||
          output.includes("4000")
        ) {
          nodeReady = true;
          console.log("✅ ServiceManager: Fuel node detected");
          checkReady();
        }

        // Look for indexer startup indicators
        if (
          output.includes("Indexer started") ||
          output.includes("GraphQL server") ||
          output.includes("4350")
        ) {
          indexerReady = true;
          console.log("✅ ServiceManager: Indexer detected");
          checkReady();
        }
      });

      process.stderr?.on("data", (data) => {
        const output = data.toString();
        console.error("[NX-DEV ERROR]", output);

        // Don't fail on warnings, only on critical errors
        if (
          output.includes("EADDRINUSE") ||
          output.includes("Permission denied")
        ) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            reject(new Error(`Service startup failed: ${output}`));
          }
        }
      });

      process.on("error", (error) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          reject(error);
        }
      });

      // Fallback: poll for services after a delay
      setTimeout(async () => {
        if (!hasResolved) {
          console.log("🔍 ServiceManager: Polling for services...");
          const statuses = await this.checkAllServices();

          if (statuses.every((s) => s.isRunning)) {
            hasResolved = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      }, 10000); // Poll after 10 seconds
    });
  }

  /**
   * Find project root directory
   */
  private findProjectRoot(): string {
    let currentDir = __dirname;
    while (
      currentDir !== "/" &&
      !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
    ) {
      currentDir = path.dirname(currentDir);
    }
    return currentDir;
  }

  /**
   * Wait for all services to be ready with health checks
   */
  private async waitForServicesReady(maxWaitTime = 60000): Promise<void> {
    console.log("⏳ ServiceManager: Waiting for services to be ready...");

    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const statuses = await this.checkAllServices();
      const allReady = statuses.every((status) => status.isRunning);

      if (allReady) {
        console.log("🎉 ServiceManager: All services are ready!");
        return;
      }

      // Log status of each service
      statuses.forEach((status) => {
        const statusIcon = status.isRunning ? "✅" : "⏳";
        console.log(
          `${statusIcon} ${status.name}: ${status.isRunning ? "Ready" : "Not ready"}`
        );
        if (status.error) {
          console.log(`   Error: ${status.error}`);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `Timeout waiting for services to be ready (${maxWaitTime}ms)`
    );
  }

  /**
   * Check health status of all services
   */
  async checkAllServices(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];

    for (const [key, config] of this.services) {
      const status = await this.checkServiceHealth(config);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(config: ServiceConfig): Promise<ServiceStatus> {
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: config.healthCheckQuery || '{"query": "{ __typename }"}',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      return {
        name: config.name,
        isRunning: response.ok,
        url: config.url,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return {
        name: config.name,
        isRunning: false,
        url: config.url,
        lastChecked: new Date(),
        error: error.message || "Connection failed",
      };
    }
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(intervalMs = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        const statuses = await this.checkAllServices();
        const failedServices = statuses.filter((s) => !s.isRunning);

        if (failedServices.length > 0) {
          console.warn("⚠️ ServiceManager: Some services are not healthy:");
          failedServices.forEach((service) => {
            console.warn(`  - ${service.name}: ${service.error}`);
          });
        }
      } catch (error) {
        console.error("❌ ServiceManager: Health check failed:", error);
      }
    }, intervalMs);
  }

  /**
   * Stop all services and cleanup
   */
  async stopAllServices(): Promise<void> {
    console.log("🛑 ServiceManager: Stopping all services...");

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Kill all processes
    for (const [name, process] of this.processes) {
      try {
        console.log(`🔪 ServiceManager: Killing process ${name}...`);
        process.kill("SIGTERM");

        // Give process time to shutdown gracefully
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force kill if still running
        if (!process.killed) {
          process.kill("SIGKILL");
        }
      } catch (error) {
        console.warn(
          `⚠️ ServiceManager: Failed to kill process ${name}:`,
          error
        );
      }
    }

    this.processes.clear();
    console.log("✅ ServiceManager: All services stopped");
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Get all service configurations
   */
  getAllServiceConfigs(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if a specific service is running
   */
  async isServiceRunning(serviceName: string): Promise<boolean> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const status = await this.checkServiceHealth(config);
    return status.isRunning;
  }

  /**
   * Wait for a specific service to be ready
   */
  async waitForService(
    serviceName: string,
    maxWaitTime = 30000
  ): Promise<void> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    console.log(`⏳ ServiceManager: Waiting for ${config.name} to be ready...`);

    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkServiceHealth(config);

      if (status.isRunning) {
        console.log(`✅ ServiceManager: ${config.name} is ready!`);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `Timeout waiting for ${config.name} to be ready (${maxWaitTime}ms)`
    );
  }
}

// Singleton instance
export const serviceManager = new ServiceManager();
