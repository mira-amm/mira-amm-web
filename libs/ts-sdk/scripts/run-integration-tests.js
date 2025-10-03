#!/usr/bin/env node

import {spawn} from "child_process";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIMEOUT_MS = 120000; // 2 minutes
const POLL_INTERVAL = 2000; // 2 seconds

// Service configurations
const SERVICES = {
  node: {
    url: "http://localhost:4000/v1/graphql",
    name: "Fuel Node",
  },
  indexer: {
    url: "http://localhost:4350/graphql",
    name: "Indexer",
  },
};

let indexerProcess = null;
let testProcess = null;

// Cleanup function
const cleanup = (exitCode = 0) => {
  console.log("\n🧹 Cleaning up processes...");

  if (testProcess) {
    testProcess.kill("SIGTERM");
  }

  if (indexerProcess) {
    indexerProcess.kill("SIGTERM");
  }

  process.exit(exitCode);
};

// Handle cleanup on exit
process.on("SIGINT", () => cleanup(130));
process.on("SIGTERM", () => cleanup(143));
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  cleanup(1);
});

// Check if a service is running
async function isServiceRunning(url, name) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({query: "{ __typename }"}),
      timeout: 5000,
    });

    if (response.ok) {
      console.log(`✅ ${name} is running`);
      return true;
    }

    console.log(`⏳ ${name} not ready (status: ${response.status})`);
    return false;
  } catch (error) {
    console.log(`⏳ ${name} not ready (${error.message})`);
    return false;
  }
}

// Wait for services to be ready
async function waitForServices() {
  console.log("⏳ Waiting for services to be ready...");

  const startTime = Date.now();

  while (Date.now() - startTime < TIMEOUT_MS) {
    const nodeReady = await isServiceRunning(
      SERVICES.node.url,
      SERVICES.node.name
    );
    const indexerReady = await isServiceRunning(
      SERVICES.indexer.url,
      SERVICES.indexer.name
    );

    if (nodeReady && indexerReady) {
      console.log("🎉 All services are ready!");
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error(`❌ Timeout waiting for services to start (${TIMEOUT_MS}ms)`);
}

// Start the indexer and node
async function startServices() {
  console.log("🚀 Starting indexer and node...");

  // Check if services are already running
  const nodeRunning = await isServiceRunning(
    SERVICES.node.url,
    SERVICES.node.name
  );
  const indexerRunning = await isServiceRunning(
    SERVICES.indexer.url,
    SERVICES.indexer.name
  );

  if (nodeRunning && indexerRunning) {
    console.log("♻️ Services already running, skipping startup");
    return true;
  }

  return new Promise((resolve, reject) => {
    indexerProcess = spawn("pnpm", ["nx", "dev", "indexer"], {
      stdio: "pipe",
      shell: true,
      cwd: process.cwd().replace(/\/libs\/ts-sdk$/, ""),
    });

    let hasStarted = false;
    const timeout = setTimeout(() => {
      if (!hasStarted) {
        reject(new Error("Timeout starting indexer process"));
      }
    }, 30000);

    indexerProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      console.log("[INDEXER]", output.trim());

      // Look for startup indicators
      if (
        output.includes("Fuel node started") ||
        output.includes("Indexer started") ||
        output.includes("4000") ||
        output.includes("4350")
      ) {
        if (!hasStarted) {
          hasStarted = true;
          clearTimeout(timeout);
          resolve(true);
        }
      }
    });

    indexerProcess.stderr?.on("data", (data) => {
      console.error("[INDEXER ERROR]", data.toString());
    });

    indexerProcess.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    indexerProcess.on("exit", (code) => {
      if (!hasStarted) {
        clearTimeout(timeout);
        reject(new Error(`Indexer process exited with code ${code}`));
      }
    });
  });
}

// Run the integration tests
async function runTests() {
  console.log("🧪 Running integration tests...");

  return new Promise((resolve, reject) => {
    // Run vitest from the ts-sdk directory
    const tsSdkDir = __dirname.replace("/scripts", "");
    testProcess = spawn(
      "vitest",
      ["run", "test/integration/*.integration.test.ts"],
      {
        stdio: "inherit",
        shell: true,
        cwd: tsSdkDir,
      }
    );

    testProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("✅ Integration tests passed!");
        resolve(true);
      } else {
        console.error(`❌ Integration tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on("error", (error) => {
      console.error("❌ Error running tests:", error);
      reject(error);
    });
  });
}

// Main execution
async function main() {
  try {
    console.log("🎯 Starting SDK V2 Integration Test Suite");
    console.log("=====================================\n");

    // Start services
    await startServices();

    // Wait for services to be ready
    await waitForServices();

    // Run tests
    await runTests();

    console.log("\n🎉 Integration test suite completed successfully!");
    cleanup(0);
  } catch (error) {
    console.error("\n❌ Integration test suite failed:", error.message);
    cleanup(1);
  }
}

main();
