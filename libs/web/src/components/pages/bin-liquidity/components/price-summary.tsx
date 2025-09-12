interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

const PriceSummary = ({
  assetA,
  assetB,
}: {
  assetA: AssetData;
  assetB: AssetData;
}) => {
  const symbolA = assetA?.metadata?.symbol || "Asset A";
  const symbolB = assetB?.metadata?.symbol || "Asset B";

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base font-medium">
          You'll receive
        </div>
      </div>

      <div className="bg-background-primary p-5 rounded-lg flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-primary text-sm">
              Minimum Expected {symbolA}:
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-accent-secondary rounded-full mr-2"></div>
              <span className="text-accent-primary text-sm">0.0453</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-accent-primary text-sm">
              Minimum Expected {symbolB}:
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
              <span className="text-accent-primary text-sm">0.0453</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-secondary text-sm">Price range:</div>
            <div className="flex items-center">
              <span className="text-accent-secondary text-sm">
                2377.84049 - 2452.67001 USDC per {symbolB}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-accent-secondary text-sm">
              Amount Slippage Tolerance
            </div>
            <div className="flex items-center">
              <span className="text-accent-secondary text-sm">0.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;
