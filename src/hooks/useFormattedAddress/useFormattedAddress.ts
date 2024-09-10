import { useMemo } from 'react';
import {B256Address, toBech32} from "fuels";

const useFormattedAddress = (address: B256Address | null) => {
  return useMemo(() => {
    const fuelAddress = address ? toBech32(address) : '';
    return fuelAddress ? fuelAddress.slice(0, 6).concat('...', fuelAddress.slice(-4)) : '';
  }, [address]);
};

export default useFormattedAddress;
