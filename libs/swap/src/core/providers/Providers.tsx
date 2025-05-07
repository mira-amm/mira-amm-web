"use client";

import {ReactNode, Suspense, useEffect, useState} from "react";
import NextAdapterApp from "next-query-params/app";
import {QueryParamProvider} from "use-query-params";
import {QueryClient} from "@tanstack/react-query";
import {
  PersistQueryClientOptions,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import {createSyncStoragePersister} from "@tanstack/query-sync-storage-persister";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import FuelProviderWrapper from "libs/swap/src/core/providers/FuelProviderWrapper";
import DisclaimerWrapper from "libs/swap/src/core/providers/DisclaimerWrapper";
import AssetsConfigProvider from "libs/swap/src/core/providers/AssetsConfigProvider";

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

const localStoragePersistor = createSyncStoragePersister({
  storage: undefined,
});

const defaultPersistOptions: PersistQueryClientOptions = {
  // @ts-ignore
  queryClient,
  persister: localStoragePersistor,
  maxAge: 1000 * 60 * 60 * 12,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => !!query.meta?.persist,
  },
};

const Providers = ({children}: Props) => {
  const [persistOptions, setPersistOptions] =
    useState<PersistQueryClientOptions>(defaultPersistOptions);

  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    setPersistOptions({
      ...defaultPersistOptions,
      persister,
    });
  }, []);

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
