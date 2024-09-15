import { useMemo } from 'react';
import {B256Address, toBech32} from "fuels";

const useFormattedAddress = (address: B256Address | null, convertToBech32 = true) => {
  return useMemo(() => {
    if (!address) {
      return '';
    }

    const addressToUse = convertToBech32 ? toBech32(address) : address;
    return addressToUse ? addressToUse.slice(0, 6).concat('...', addressToUse.slice(-4)) : '';
  }, [address, convertToBech32]);
};

export default useFormattedAddress;
