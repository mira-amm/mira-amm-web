/**
 * Server-side indexer instantiation
 * This file can be used in both server and client environments
 */

import {ISubsquidIndexer} from "./interfaces";
import {SubsquidIndexer} from "./implementations";
import {createMockIndexer} from "./mock";

/**
 * Get indexer instance for server-side usage
 * This function works in both server and client environments
 */
export function getServerIndexer(): ISubsquidIndexer {
  const shouldUseMock =
    process.env.NEXT_PUBLIC_USE_MOCK_INDEXER === "true" ||
    process.env.NODE_ENV === "test";

  if (shouldUseMock) {
    console.log("🚀 Using Mock Indexer (server-side)");
    return createMockIndexer();
  }

  return new SubsquidIndexer();
}
