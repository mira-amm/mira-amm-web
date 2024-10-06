import {useQuery} from "@tanstack/react-query";
import {CryptoApisKey} from "@/src/utils/constants";

const useUSDRate = (assetName: string | null) => {
  const { data } = useQuery({
    queryKey: ['usdRate', assetName],
    queryFn: async () => {
      const response = await fetch(
        `https://rest.cryptoapis.io/market-data/exchange-rates/by-symbols/${assetName}/usd`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CryptoApisKey,
          },
        },
      );
      return await response.json();
    },
    enabled: Boolean(assetName),
  });

  console.log('USD Rate:', data);
};

export default useUSDRate;
