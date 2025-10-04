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
  healthCheckTimeout: number;
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
      healthCheckQuery: '{"query": "{ nodeInfo { nodeVersion } }"}',
      startupTimeout: 30000,
      healthCheckTimeout: 5000,
    });

    this.services.set("indexer", {
      name: "Indexer",
      url: "http://localhost:4350/graphql",
      port: 4350,
      healthCheckQuery: '{"query": "{ __schema { queryType { name } } }"}',
      startupTimeout: 45000,
      healthCheckTimeout: 10000,
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
    const fuelNodeRunning =
      statuses.find((s) => s.name === "Fuel Node")?.isRunning || false;
    const indexerRunning =
      statuses.find((s) => s.name === "Indexer")?.isRunning || false;

    if (fuelNodeRunning && indexerRunning) {
      console.log("♻️ ServiceManager: All services already running");
      this.startHealthMonitoring();
      return;
    }

    // Check for port conflicts before starting
    await this.checkPortConflicts();

    // Start services in proper sequence: node first, then indexer
    if (!fuelNodeRunning) {
      console.log(
        "🔧 ServiceManager: Fuel node not detected, starting via nx..."
      );
    }
    if (!indexerRunning) {
      console.log(
        "🔧 ServiceManager: Indexer not detected, will start after node..."
      );
    }

    // Start services using nx dev indexer command (starts both)
    try {
      await this.startServicesViaNx();
    } catch (error) {
      await this.handleStartupFailure(error as Error);
    }

    // Wait for services to be ready with proper sequencing
    await this.waitForServicesReady();

    // Start health monitoring
    this.startHealthMonitoring();

    console.log("✅ ServiceManager: All services started and ready");
  }

  /**
   * Diagnose common startup issues
   */
  private async diagnoseStartupIssues(): Promise<string[]> {
    const issues: string[] = [];

    // Check if ports are available
    const portChecks = await Promise.all([
      this.isPortInUse(4000),
      this.isPortInUse(4350),
    ]);

    if (portChecks[0]) {
      issues.push("Port 4000 (Fuel Node) is already in use by another process");
    }
    if (portChecks[1]) {
      issues.push("Port 4350 (Indexer) is already in use by another process");
    }

    // Check if nx is available
    try {
      const {execSync} = require("child_process");
      execSync("pnpm nx --version", {stdio: "pipe"});
    } catch (error) {
      issues.push(
        "nx command not available - ensure pnpm and nx are installed"
      );
    }

    // Check if we're in the right directory
    const projectRoot = this.findProjectRoot();
    if (!fs.existsSync(path.join(projectRoot, "pnpm-workspace.yaml"))) {
      issues.push(
        "Not in a valid pnpm workspace - cannot find pnpm-workspace.yaml"
      );
    }

    // Check if indexer project exists
    if (!fs.existsSync(path.join(projectRoot, "apps/indexer"))) {
      issues.push("Indexer project not found at apps/indexer");
    }

    return issues;
  }

  /**
   * Handle startup failure with detailed diagnostics
   */
  private async handleStartupFailure(error: Error): Promise<never> {
    console.error("❌ ServiceManager: Service startup failed");
    console.error("Error:", error.message);

    // Run diagnostics
    console.log("🔍 ServiceManager: Running diagnostics...");
    const issues = await this.diagnoseStartupIssues();

    if (issues.length > 0) {
      console.error("🚨 ServiceManager: Detected issues:");
      issues.forEach((issue, index) => {
        console.error(`  ${index + 1}. ${issue}`);
      });
    }

    // Provide helpful suggestions
    console.log("💡 ServiceManager: Troubleshooting suggestions:");
    console.log(
      "  1. Ensure no other Fuel node or indexer processes are running"
    );
    console.log("  2. Check that ports 4000 and 4350 are available");
    console.log("  3. Verify you're in the project root directory");
    console.log(
      "  4. Try running 'pnpm install' to ensure dependencies are installed"
    );
    console.log(
      "  5. Try running 'pnpm nx dev indexer' manually to see detailed output"
    );

    // Check current service status
    const statuses = await this.checkAllServices();
    console.log("📊 ServiceManager: Current service status:");
    statuses.forEach((status) => {
      const icon = status.isRunning ? "✅" : "❌";
      console.log(
        `  ${icon} ${status.name}: ${status.isRunning ? "Running" : "Not running"}`
      );
      if (status.error) {
        console.log(`     Error: ${status.error}`);
      }
    });

    throw new Error(
      `Service startup failed: ${error.message}. See diagnostics above for troubleshooting.`
    );
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

        // Handle specific error cases with detailed messages
        if (output.includes("EADDRINUSE")) {
          const portMatch = output.match(/port (\d+)/i);
          const port = portMatch ? portMatch[1] : "unknown";
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            reject(
              new Error(
                `Port ${port} is already in use. Please stop any existing Fuel node or indexer processes, ` +
                  `or use 'lsof -ti:${port} | xargs kill -9' to force kill processes on this port.`
              )
            );
          }
        } else if (output.includes("Permission denied")) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            reject(
              new Error(
                `Permission denied error. This may be due to insufficient permissions or ` +
                  `port access restrictions. Try running with appropriate permissions.`
              )
            );
          }
        } else if (output.includes("ENOENT") && output.includes("pnpm")) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            reject(
              new Error(
                `pnpm command not found. Please install pnpm: npm install -g pnpm`
              )
            );
          }
        } else if (output.includes("Cannot find project")) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            reject(
              new Error(
                `Indexer project not found. Ensure you're in the correct workspace directory ` +
                  `and the indexer project exists at apps/indexer.`
              )
            );
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
   * Check for port conflicts before starting services
   */
  private async checkPortConflicts(): Promise<void> {
    const portChecks = Array.from(this.services.values()).map(
      async (config) => {
        const isPortInUse = await this.isPortInUse(config.port);
        if (isPortInUse) {
          // Check if it's our service or something else
          const status = await this.checkServiceHealth(config);
          if (!status.isRunning) {
            // Try to identify what's using the port
            const processInfo = await this.getPortProcessInfo(config.port);
            throw new Error(
              `Port ${config.port} is in use by another process, but ${config.name} is not responding.\n` +
                `${processInfo ? `Process using port: ${processInfo}` : "Unable to identify the process."}\n` +
                `Please stop the process using port ${config.port} or use 'lsof -ti:${config.port} | xargs kill -9' to force kill.`
            );
          }
        }
        return {port: config.port, inUse: isPortInUse, service: config.name};
      }
    );

    const results = await Promise.all(portChecks);
    const conflicts = results.filter((r) => r.inUse);

    if (conflicts.length > 0) {
      console.log("🔍 ServiceManager: Port usage detected:");
      conflicts.forEach((conflict) => {
        console.log(`  - Port ${conflict.port} (${conflict.service}): In use`);
      });
    }
  }

  /**
   * Check if a port is in use
   */
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require("net");
      const server = net.createServer();

      server.listen(port, () => {
        server.once("close", () => {
          resolve(false);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(true);
      });
    });
  }

  /**
   * Get information about what process is using a port
   */
  private async getPortProcessInfo(port: number): Promise<string | null> {
    try {
      const {execSync} = require("child_process");
      const result = execSync(`lsof -ti:${port}`, {
        encoding: "utf8",
        stdio: "pipe",
      });
      const pid = result.trim();

      if (pid) {
        try {
          const processInfo = execSync(`ps -p ${pid} -o comm=`, {
            encoding: "utf8",
            stdio: "pipe",
          });
          return `PID ${pid} (${processInfo.trim()})`;
        } catch {
          return `PID ${pid}`;
        }
      }
    } catch {
      // lsof command failed or not available
    }

    return null;
  }

  /**
   * Wait for all services to be ready with health checks
   */
  private async waitForServicesReady(maxWaitTime?: number): Promise<void> {
    console.log("⏳ ServiceManager: Waiting for services to be ready...");

    // Use the maximum startup timeout from all services if not specified
    const defaultMaxWaitTime =
      Math.max(
        ...Array.from(this.services.values()).map((s) => s.startupTimeout)
      ) + 15000; // Add 15s buffer

    const actualMaxWaitTime = maxWaitTime || defaultMaxWaitTime;
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    let lastLogTime = 0;

    while (Date.now() - startTime < actualMaxWaitTime) {
      const statuses = await this.checkAllServices();
      const allReady = statuses.every((status) => status.isRunning);

      if (allReady) {
        console.log("🎉 ServiceManager: All services are ready!");
        return;
      }

      // Log status every 10 seconds to avoid spam
      const currentTime = Date.now();
      if (currentTime - lastLogTime > 10000) {
        console.log(
          `⏳ ServiceManager: Waiting for services (${Math.round((currentTime - startTime) / 1000)}s elapsed)...`
        );
        statuses.forEach((status) => {
          const statusIcon = status.isRunning ? "✅" : "⏳";
          console.log(
            `  ${statusIcon} ${status.name}: ${status.isRunning ? "Ready" : "Not ready"}`
          );
          if (status.error) {
            console.log(`     Error: ${status.error}`);
          }
        });
        lastLogTime = currentTime;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Provide detailed error information on timeout
    const finalStatuses = await this.checkAllServices();
    const failedServices = finalStatuses.filter((s) => !s.isRunning);

    let errorMessage = `Timeout waiting for services to be ready (${actualMaxWaitTime}ms)\n`;
    errorMessage += "Failed services:\n";
    failedServices.forEach((service) => {
      errorMessage += `  - ${service.name}: ${service.error || "Unknown error"}\n`;
    });

    throw new Error(errorMessage);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.healthCheckTimeout
      );

      const response = await fetch(config.url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: config.healthCheckQuery || '{"query": "{ __typename }"}',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          name: config.name,
          isRunning: false,
          url: config.url,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      // Validate response is valid GraphQL
      const responseData = await response.json();
      if (responseData.errors && responseData.errors.length > 0) {
        return {
          name: config.name,
          isRunning: false,
          url: config.url,
          lastChecked: new Date(),
          error: `GraphQL errors: ${responseData.errors.map((e: any) => e.message).join(", ")}`,
        };
      }

      return {
        name: config.name,
        isRunning: true,
        url: config.url,
        lastChecked: new Date(),
      };
    } catch (error: any) {
      let errorMessage = "Connection failed";

      if (error.name === "AbortError") {
        errorMessage = `Health check timeout (${config.healthCheckTimeout}ms)`;
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = `Connection refused on port ${config.port}`;
      } else if (error.code === "ENOTFOUND") {
        errorMessage = "Service not found (DNS resolution failed)";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        name: config.name,
        isRunning: false,
        url: config.url,
        lastChecked: new Date(),
        error: errorMessage,
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
   * Check if Fuel node is running on port 4000
   */
  async isFuelNodeRunning(): Promise<boolean> {
    return this.isServiceRunning("fuel-node");
  }

  /**
   * Check if indexer is running on port 4350
   */
  async isIndexerRunning(): Promise<boolean> {
    return this.isServiceRunning("indexer");
  }

  /**
   * Get detailed service detection results
   */
  async getServiceDetectionResults(): Promise<{
    fuelNode: {running: boolean; port: number; responding: boolean};
    indexer: {running: boolean; port: number; responding: boolean};
  }> {
    const fuelNodeConfig = this.services.get("fuel-node")!;
    const indexerConfig = this.services.get("indexer")!;

    const [fuelNodeStatus, indexerStatus] = await Promise.all([
      this.checkServiceHealth(fuelNodeConfig),
      this.checkServiceHealth(indexerConfig),
    ]);

    const [fuelNodePortInUse, indexerPortInUse] = await Promise.all([
      this.isPortInUse(fuelNodeConfig.port),
      this.isPortInUse(indexerConfig.port),
    ]);

    return {
      fuelNode: {
        running: fuelNodePortInUse,
        port: fuelNodeConfig.port,
        responding: fuelNodeStatus.isRunning,
      },
      indexer: {
        running: indexerPortInUse,
        port: indexerConfig.port,
        responding: indexerStatus.isRunning,
      },
    };
  }

  /**
   * Wait for a specific service to be ready
   */
  async waitForService(
    serviceName: string,
    maxWaitTime?: number
  ): Promise<void> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const actualMaxWaitTime = maxWaitTime || config.startupTimeout;
    console.log(
      `⏳ ServiceManager: Waiting for ${config.name} to be ready (timeout: ${actualMaxWaitTime}ms)...`
    );

    const startTime = Date.now();
    const pollInterval = 1000; // 1 second
    let lastStatus: ServiceStatus | null = null;

    while (Date.now() - startTime < actualMaxWaitTime) {
      const status = await this.checkServiceHealth(config);

      if (status.isRunning) {
        console.log(`✅ ServiceManager: ${config.name} is ready!`);
        return;
      }

      // Log status changes
      if (!lastStatus || lastStatus.error !== status.error) {
        console.log(`⏳ ${config.name}: ${status.error || "Checking..."}`);
        lastStatus = status;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    const finalStatus = await this.checkServiceHealth(config);
    throw new Error(
      `Timeout waiting for ${config.name} to be ready (${actualMaxWaitTime}ms). ` +
        `Last error: ${finalStatus.error || "Unknown error"}`
    );
  }

  /**
   * Configure service timeouts
   */
  configureTimeouts(
    serviceName: string,
    startupTimeout?: number,
    healthCheckTimeout?: number
  ): void {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    if (startupTimeout !== undefined) {
      config.startupTimeout = startupTimeout;
    }
    if (healthCheckTimeout !== undefined) {
      config.healthCheckTimeout = healthCheckTimeout;
    }

    console.log(
      `⚙️ ServiceManager: Updated timeouts for ${config.name}: startup=${config.startupTimeout}ms, healthCheck=${config.healthCheckTimeout}ms`
    );
  }

  /**
   * Configure timeouts for all services
   */
  configureAllTimeouts(
    startupTimeout?: number,
    healthCheckTimeout?: number
  ): void {
    for (const [serviceName] of this.services) {
      this.configureTimeouts(serviceName, startupTimeout, healthCheckTimeout);
    }
  }
}

// Singleton instance
export const serviceManager = new ServiceManager();
