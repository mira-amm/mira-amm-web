import {useQuery} from "@tanstack/react-query";
import {AssetRatesApiUrl} from "@/src/utils/constants";

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

type USDRateData = {
  "apiVersion": string;
  "requestId": string;
  "data": {
    "item": {
      "calculationTimestamp": number;
      "fromAssetId": string;
      "fromAssetSymbol": string;
      "rate": string;
      "toAssetId": string;
      "toAssetSymbol": string;
    },
  },
};

type ReturnType = {
  asset: string;
  rate: string;
}[];

const useUSDRate = (firstAssetName: string | null, secondAssetName: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['usdRate', firstAssetName],
    queryFn: async () => {
      const data: [USDRateData, USDRateData] = await Promise.all([
        fetch(`${AssetRatesApiUrl}/${firstAssetName}/usd`).then((res) => res.json()),
        fetch(`${AssetRatesApiUrl}/${secondAssetName}/usd`).then((res) => res.json()),
      ]);

      const returnData: ReturnType = data.map(item => ({
        asset: item.data.item.fromAssetSymbol,
        rate: item.data.item.rate,
      }));

      return returnData;
    },
    enabled: Boolean(firstAssetName && secondAssetName),
  });

  return { ratesData: data, ratesLoading: isLoading };
};

export default useUSDRate;
