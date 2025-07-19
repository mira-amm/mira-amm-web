/* import { queryClient } from '@/shared/lib/queryClient' */
import {QueryClientProvider} from "@tanstack/react-query";
/* import { FuelProviderWrapper } from '@/shared/ui/Terminal/fuel-provider-wrapper' */
import {BootSequence} from "@/shared/ui/Terminal/BootSequence";
import {PasswordPrompt} from "@/shared/ui/Terminal/PasswordPrompt";

export default function Login() {
  return (
    <>
      {/* TODO: complete fuel wallet connection to get wallet address */}
      {/* <QueryClientProvider client={queryClient}>
            <FuelProviderWrapper> */}
      <BootSequence />
      <PasswordPrompt />
      {/* </FuelProviderWrapper>
        </QueryClientProvider> */}
    </>
  );
}
