"use client";

import {ReactNode, Suspense} from "react";
import NextAdapterApp from "next-query-params/app";
import {QueryParamProvider} from "use-query-params";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import FuelProviderWrapper from "@/src/core/providers/FuelProviderWrapper";
import DisclaimerWrapper from "@/src/core/providers/DisclaimerWrapper";
import AssetsConfigProvider from "@/src/core/providers/AssetsConfigProvider";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient();

const Providers = ({children}: Props) => {
  return (
    <Suspense>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <QueryParamProvider adapter={NextAdapterApp}>
          <FuelProviderWrapper>
            <DisclaimerWrapper>
              <AssetsConfigProvider>{children}</AssetsConfigProvider>
            </DisclaimerWrapper>
          </FuelProviderWrapper>
        </QueryParamProvider>
      </QueryClientProvider>
    </Suspense>
  );
};

export default Providers;
