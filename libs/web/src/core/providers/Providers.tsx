"use client";

import {ReactNode, Suspense} from "react";
import NextAdapterApp from "next-query-params/app";
import {QueryParamProvider} from "use-query-params";
import {QueryClient} from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  PersistQueryClientOptions,
} from "@tanstack/react-query-persist-client";
import {createSyncStoragePersister} from "@tanstack/query-sync-storage-persister";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {Toaster} from "sonner";

import {FuelProviderWrapper} from "@/src/core/providers/FuelProviderWrapper";
import {DisclaimerWrapper} from "@/src/core/providers/DisclaimerWrapper";
import {Loader} from "@/src/components/common";
import {ThemeProvider} from "./theme-provider";
import {useIsRebrandEnabled} from "@/src/hooks/useIsRebrandEnabled";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
    },
  },
});

function QueryParamProviderWrapper({children}: {children: ReactNode}) {
  return (
    <Suspense fallback={<Loader />}>
      <QueryParamProvider adapter={NextAdapterApp}>
        {children}
      </QueryParamProvider>
    </Suspense>
  );
}

const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({storage: window.localStorage})
    : undefined;

const persistOptions: PersistQueryClientOptions = {
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 12,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => !!query.meta?.persist,
  },
};

export function Providers({children}: {children: ReactNode}) {
  const rebrandEnabled = useIsRebrandEnabled();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <ReactQueryDevtools initialIsOpen={false} />
      <QueryParamProviderWrapper>
        <FuelProviderWrapper>
          <DisclaimerWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme={rebrandEnabled ? "light" : "dark"}
              enableSystem
              disableTransitionOnChange
            >
              <Toaster richColors position="bottom-right" />
              {children}
            </ThemeProvider>
          </DisclaimerWrapper>
        </FuelProviderWrapper>
      </QueryParamProviderWrapper>
    </PersistQueryClientProvider>
  );
}
