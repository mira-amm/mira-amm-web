import type {Config} from "jest";

const config: Config = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/apps/web-e2e"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", {useESM: true}], // Enable ESM in ts-jest
  },
  extensionsToTreatAsEsm: [".ts"], // Treat TypeScript files as ES modules
};

export default config;
