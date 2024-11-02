'use client';

import {ReactNode} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import FuelProviderWrapper from "@/src/core/providers/FuelProviderWrapper";
import DisclaimerWrapper from "@/src/core/providers/DisclaimerWrapper";
import AssetsConfigProvider from "@/src/core/providers/AssetsConfigProvider";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient();

const Providers = ({children}: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <FuelProviderWrapper>
        <DisclaimerWrapper>
          <AssetsConfigProvider>
            {children}
          </AssetsConfigProvider>
        </DisclaimerWrapper>
      </FuelProviderWrapper>
    </QueryClientProvider>
  );
};

export default Providers;
