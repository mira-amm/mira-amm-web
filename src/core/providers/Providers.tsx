'use client';

import {ReactNode} from "react";
import {FuelProvider} from "@fuels/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BurnerWalletConnector, FueletWalletConnector, FuelWalletConnector} from "@fuels/connectors";
import {FuelConfig, FuelConnector} from "fuels";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient();

const Providers = ({children}: Props) => {
  let connectors: FuelConnector[] = [];
  if (typeof window !== 'undefined') {
    connectors = [
      new FueletWalletConnector(),
      new FuelWalletConnector(),
      new BurnerWalletConnector(),
    ];
  }

  const fuelConfig: FuelConfig = {
    connectors,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FuelProvider
        fuelConfig={fuelConfig}
        theme="dark"
      >
        {children}
      </FuelProvider>
    </QueryClientProvider>
  );
};

export default Providers;
