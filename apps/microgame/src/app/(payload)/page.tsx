"use client";

import FuelProviderWrapper from "@/shared/ui/Terminal/FuelProviderWrapper";
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from "@/shared/lib/queryClient";
import Terminal from "@/shared/ui/Terminal/Terminal";

import "@/shared/ui/index.css";

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <FuelProviderWrapper>
        <div className="min-h-screen w-full flex items-center justify-center bg-black font-['VT323',monospace]">
          <Terminal />
        </div>
      </FuelProviderWrapper>
    </QueryClientProvider>
  );
}
