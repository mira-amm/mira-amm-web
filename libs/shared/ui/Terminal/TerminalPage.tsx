"use client";

import {queryClient} from "@/shared/lib/queryClient";
import {QueryClientProvider} from "@tanstack/react-query";
import {FuelProviderWrapper} from "./fuel-provider-wrapper";
import {Terminal} from "./Terminal";

export function TerminalPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <FuelProviderWrapper>
        <Terminal />
      </FuelProviderWrapper>
    </QueryClientProvider>
  );
}
