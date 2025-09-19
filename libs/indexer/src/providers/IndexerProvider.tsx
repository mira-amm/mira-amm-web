"use client";

import * as React from "react";
const {createContext, useContext, useMemo} = React;
import {ISubsquidIndexer, IndexerConfig} from "../interfaces";
import {SubsquidIndexer} from "../implementations";
import {createMockIndexer} from "../mock";

interface IndexerContextType {
  indexer: ISubsquidIndexer;
}

const IndexerContext = createContext<IndexerContextType | undefined>(undefined);

interface IndexerProviderProps {
  children: React.ReactNode;
  indexer?: ISubsquidIndexer;
  endpoint?: string;
  config?: IndexerConfig;
  forceMock?: boolean; // Force mock mode regardless of environment
}

export function IndexerProvider({
  children,
  indexer: injectedIndexer,
  endpoint,
  config,
  forceMock,
}: IndexerProviderProps) {
  const indexerInstance = useMemo(() => {
    if (injectedIndexer) {
      return injectedIndexer;
    }

    // Check for mock mode via environment variable or forceMock prop
    const shouldUseMock =
      forceMock ||
      process.env.NEXT_PUBLIC_USE_MOCK_INDEXER === "true" ||
      process.env.NODE_ENV === "test";

    if (shouldUseMock) {
      console.log("🚀 IndexerProvider: Using Mock Indexer for development");
      return createMockIndexer(endpoint, config);
    }

    console.log("🔗 IndexerProvider: Using Real Subsquid Indexer");
    return new SubsquidIndexer(endpoint, config);
  }, [injectedIndexer, endpoint, config, forceMock]);

  const value = useMemo(
    () => ({
      indexer: indexerInstance,
    }),
    [indexerInstance]
  );

  return (
    <IndexerContext.Provider value={value}>{children}</IndexerContext.Provider>
  );
}

export function useIndexer(): ISubsquidIndexer {
  const context = useContext(IndexerContext);
  if (context === undefined) {
    throw new Error("useIndexer must be used within an IndexerProvider");
  }
  return context.indexer;
}

// Helper function to get indexer instance outside of React context
export function getIndexer(): ISubsquidIndexer {
  const shouldUseMock =
    process.env.NEXT_PUBLIC_USE_MOCK_INDEXER === "true" ||
    process.env.NODE_ENV === "test";

  if (shouldUseMock) {
    return createMockIndexer();
  }

  return new SubsquidIndexer();
}
