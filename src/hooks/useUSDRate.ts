import {useQuery} from "@tanstack/react-query";

const useUSDRate = (assetName: string | null) => {
  const { data } = useQuery({
    queryKey: ['usdRate', assetName],
    queryFn: async () => {
      const response = await fetch(
        `https://nhnv2j1cac.execute-api.us-east-1.amazonaws.com/crypto-api/market-data/exchange-rates/by-symbols/eth/usd`,
      );
      return await response.json();
    },
    enabled: Boolean(assetName),
  });

  console.log('USD Rate:', data);
};

export default useUSDRate;
