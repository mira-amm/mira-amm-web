import { useMemo } from 'react';

const useFormattedAddress = (address: string | null) => {
  return useMemo(() => {
    return address ? address.slice(0, 6).concat('...', address.slice(-4)) : '';
  }, [address]);
};

export default useFormattedAddress;
