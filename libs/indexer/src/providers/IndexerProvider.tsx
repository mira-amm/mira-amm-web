"use client";

import * as React from "react";
const {createContext, useContext, useMemo} = React;
import {ISubsquidIndexer, IndexerConfig} from "../interfaces";
import {SubsquidIndexer} from "../implementations";

interface IndexerContextType {
  indexer: ISubsquidIndexer;
}

const IndexerContext = createContext<IndexerContextType | undefined>(undefined);

interface IndexerProviderProps {
  children: React.ReactNode;
  indexer?: ISubsquidIndexer;
  endpoint?: string;
  config?: IndexerConfig;
}

export function IndexerProvider({
  children,
  indexer: injectedIndexer,
  endpoint,
  config,
}: IndexerProviderProps) {
  const indexerInstance = useMemo(() => {
    if (injectedIndexer) {
      return injectedIndexer;
    }

    return new SubsquidIndexer(endpoint, config);
  }, [injectedIndexer, endpoint, config]);

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
