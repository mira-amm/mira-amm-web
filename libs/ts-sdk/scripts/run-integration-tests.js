#!/usr/bin/env node

import {spawn} from "child_process";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testProcess = null;

// Cleanup function
const cleanup = (exitCode = 0) => {
  console.log("\n🧹 Cleaning up processes...");

  if (testProcess) {
    testProcess.kill("SIGTERM");
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

// Run the integration tests with enhanced infrastructure
async function runTests() {
  console.log("🧪 Running integration tests with enhanced infrastructure...");

  return new Promise((resolve, reject) => {
    // Run vitest from the ts-sdk directory
    const tsSdkDir = __dirname.replace("/scripts", "");
    testProcess = spawn(
      "vitest",
      ["run", "test/integration/*.integration.test.ts", "--reporter=verbose"],
      {
        stdio: "inherit",
        shell: true,
        cwd: tsSdkDir,
        env: {
          ...process.env,
          // Enable enhanced test infrastructure
          USE_ENHANCED_INFRASTRUCTURE: "true",
          // Set test timeout
          VITEST_TIMEOUT: "120000",
        },
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
    console.log("🎯 Starting SDK V2 Integration Test Suite (Enhanced)");
    console.log("==================================================\n");
    console.log("ℹ️  Using enhanced test infrastructure with:");
    console.log("   - Automatic service management via nx tasks");
    console.log("   - Contract deployment validation");
    console.log("   - Service readiness checks");
    console.log("   - Automatic cleanup utilities");
    console.log("   - Enhanced error handling and retries\n");

    // The enhanced infrastructure handles service startup automatically
    // through the TestRunner and ServiceManager classes
    await runTests();

    console.log("\n🎉 Integration test suite completed successfully!");
    cleanup(0);
  } catch (error) {
    console.error("\n❌ Integration test suite failed:", error.message);
    cleanup(1);
  }
}

main();
