"use client";

import { ReactNode } from "react";
import NextAdapterApp from "next-query-params/app";
import { QueryParamProvider } from "use-query-params";
import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  PersistQueryClientOptions,
} from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { FuelProviderWrapper } from "@/src/core/providers/FuelProviderWrapper";
import { DisclaimerWrapper } from "@/src/core/providers/DisclaimerWrapper";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
    },
  },
});

const persister = typeof window !== "undefined"
  ? createSyncStoragePersister({ storage: window.localStorage })
  : undefined;

const persistOptions: PersistQueryClientOptions = {
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 12,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => !!query.meta?.persist,
  },
};

export function Providers({ children }: { children: ReactNode }){
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ReactQueryDevtools initialIsOpen={false} />
      <QueryParamProvider adapter={NextAdapterApp}>
        <FuelProviderWrapper>
          <DisclaimerWrapper>
            {children}
          </DisclaimerWrapper>
        </FuelProviderWrapper>
      </QueryParamProvider>
    </PersistQueryClientProvider>
  );
};
