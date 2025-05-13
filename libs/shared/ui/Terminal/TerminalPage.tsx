"use client";

import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import FuelProviderWrapper from './FuelProviderWrapper'
import Terminal from './Terminal'

const TerminalPage = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <FuelProviderWrapper>
                <div className="min-h-screen w-full flex items-center justify-center bg-black font-['VT323',monospace]">
                    <Terminal />
                </div>
            </FuelProviderWrapper>
        </QueryClientProvider>
    )
}

export default TerminalPage
