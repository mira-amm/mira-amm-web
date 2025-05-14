"use client";

import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import FuelProviderWrapper from './FuelProviderWrapper'
import Terminal from './Terminal'

const TerminalPage = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <FuelProviderWrapper>
                    <Terminal />
            </FuelProviderWrapper>
        </QueryClientProvider>
    )
}

export default TerminalPage
