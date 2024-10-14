import {useQuery} from "@tanstack/react-query";
import {CoinGeckoApiUrl} from "@/src/utils/constants";
import {assetHandleToSymbol, assetSymbolToCoinGeckoId} from "@/src/utils/coinsConfig";

// TODO: Use locally until dev server is configured to surpass cors
// const mockData = {
//   "apiVersion": "2023-04-25",
//   "requestId": "6703ecba9f87978d2fb1010a",
//   "data": {
//     "item": {
//       "calculationTimestamp": 1728310140,
//       "fromAssetId": "630629da4e66ce0983f2cd4d",
//       "fromAssetSymbol": "ETH",
//       "rate": "2481.655362596532",
//       "toAssetId": "630629694e66ce0983f2cd4b",
//       "toAssetSymbol": "USD"
//     },
//   },
// };
//
// const mockData2 = {
//   "apiVersion": "2023-04-25",
//   "requestId": "6703ecba9f87978d2fb1010a",
//   "data": {
//     "item": {
//       "calculationTimestamp": 1728310140,
//       "fromAssetId": "630629da4e66ce0983f2cd4d",
//       "fromAssetSymbol": "BTC",
//       "rate": "2481.655362596532",
//       "toAssetId": "630629694e66ce0983f2cd4b",
//       "toAssetSymbol": "USD"
//     },
//   },
// };

const useUSDRate = (firstAssetName: string | null, secondAssetName: string | null) => {
  const {data, isLoading} = useQuery({
    queryKey: ['usdRate', firstAssetName],
    queryFn: async () => {
      const firstAssetSymbol = firstAssetName ? assetHandleToSymbol[firstAssetName] : null;
      const secondAssetSymbol = secondAssetName ? assetHandleToSymbol[secondAssetName] : null;

      const assetIds = [firstAssetSymbol, secondAssetSymbol]
        .filter(assetId => assetId !== null)
        .map(symbol => assetSymbolToCoinGeckoId[symbol!])
        .join(",")
      let rates;
      if (!assetIds) {
        rates = {};
      } else {
        const response = await fetch(`${CoinGeckoApiUrl}/simple/price?ids=${assetIds}&vs_currencies=usd`, {
          method: 'GET',
          headers: {
            'x-cg-pro-api-key': 'CG-stXXB53Rkr4yZcZ2Je5MNt4F',
          },
        })
        rates = await response.json();
      }

      return [
        {
          asset: firstAssetName,
          rate: firstAssetSymbol ? rates[assetSymbolToCoinGeckoId[firstAssetSymbol]]?.usd ?? 0 : 0
        },
        {
          asset: secondAssetName,
          rate: secondAssetSymbol ? rates[assetSymbolToCoinGeckoId[secondAssetSymbol]]?.usd ?? 0 : 0
        },
      ]
    },
    enabled: true,
  });

  return {ratesData: data, ratesLoading: isLoading};
};

export default useUSDRate;
