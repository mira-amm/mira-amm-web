import React, {useState, useEffect} from "react";
import {calculateFlooredRate} from "./utils";
import {ArrowLeftRight} from "lucide-react";

interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
}

interface ExchangeRateProps {
  coinAAmount: string;
  coinBAmount: string;
  assetAMetadata: AssetMetadata & {isLoading: boolean};
  assetBMetadata: AssetMetadata & {isLoading: boolean};
}

const ExchangeRate = ({
  assetBMetadata,
  assetAMetadata,
  coinAAmount,
  coinBAmount,
}: ExchangeRateProps) => {
  const [flooredRate, setFlooredRate] = useState("");
  const [isBaseCoinA, setIsBaseCoinA] = useState(true);

  const shouldDisplayExchange =
    assetBMetadata?.symbol &&
    assetAMetadata?.symbol &&
    flooredRate !== null &&
    flooredRate !== undefined &&
    flooredRate !== "NaN";

  useEffect(() => {
    setFlooredRate(
      calculateFlooredRate(
        coinAAmount,
        coinBAmount,
        isBaseCoinA,
        assetAMetadata?.decimals,
      ),
    );
  }, [coinAAmount, coinBAmount, isBaseCoinA, assetAMetadata?.decimals]);

  if (!shouldDisplayExchange) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-[16px] font-normal leading-[19px]">Price</p>
      <div
        className="flex cursor-pointer"
        onClick={() => setIsBaseCoinA(!isBaseCoinA)}
      >
        <p className="flex items-center">
          {isBaseCoinA
            ? `1 ${assetBMetadata.symbol} ≈ ${flooredRate} ${assetAMetadata.symbol}`
            : `1 ${assetAMetadata.symbol} ≈ ${flooredRate} ${assetBMetadata.symbol}`}
          <span className="ml-[4px]">
            <ArrowLeftRight />
          </span>
        </p>
      </div>
    </div>
  );
};

export default ExchangeRate;
