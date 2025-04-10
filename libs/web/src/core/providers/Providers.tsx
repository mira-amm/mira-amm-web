"use client";

import {ReactNode, Suspense, useEffect, useState} from "react";
import NextAdapterApp from "next-query-params/app";
import {QueryParamProvider} from "use-query-params";
import {Query, QueryClient} from "@tanstack/react-query";
import {
  PersistQueryClientOptions,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import {createSyncStoragePersister} from "@tanstack/query-sync-storage-persister";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import FuelProviderWrapper from "@/src/core/providers/FuelProviderWrapper";
import DisclaimerWrapper from "@/src/core/providers/DisclaimerWrapper";
import AssetsConfigProvider from "@/src/core/providers/AssetsConfigProvider";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
    },
  },
});

const Providers = ({children}: Props) => {
  const [persistOptions, setPersistOptions] =
    useState<PersistQueryClientOptions | null>(null);

  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    setPersistOptions({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 1,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => !!query.meta?.persist,
      },
    });
  }, []);

  if (!persistOptions) return null;

  return (
    <Suspense>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        <ReactQueryDevtools initialIsOpen={false} />
        <QueryParamProvider adapter={NextAdapterApp}>
          <FuelProviderWrapper>
            <DisclaimerWrapper>
              <AssetsConfigProvider>{children}</AssetsConfigProvider>
            </DisclaimerWrapper>
          </FuelProviderWrapper>
        </QueryParamProvider>
      </PersistQueryClientProvider>
    </Suspense>
  );
};

export default Providers;
