const PriceSummary = ({
  selectedPeriod,
}: {
  selectedPeriod: "both" | "uni" | "eth";
}) => {
  const renderPeriod = () => {
    if (selectedPeriod === "both") {
      return (
        <>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#01EC97] text-sm">
                Minimum Expected UNI:
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
                <span className="text-[#01EC97] text-sm">0.0453</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[#01EC97] text-sm">
                Minimum Expected ETH:
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
                <span className="text-[#01EC97] text-sm">0.0453</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">Price range:</div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">
                  2377.84049 - 2452.67001 USDC per ETH
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">
                Amount Slippage Tolerance
              </div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">0.3%</span>
              </div>
            </div>
          </div>
        </>
      );
    }
    if (selectedPeriod === "uni") {
      return (
        <>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#01EC97] text-sm">
                Minimum Expected UNI:
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
                <span className="text-[#01EC97] text-sm">0.0453</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">Price range:</div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">
                  2377.84049 - 2452.67001 USDC per ETH
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">
                Amount Slippage Tolerance
              </div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">0.3%</span>
              </div>
            </div>
          </div>
        </>
      );
    }
    if (selectedPeriod === "eth") {
      return (
        <>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#01EC97] text-sm">
                Minimum Expected ETH:
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
                <span className="text-[#01EC97] text-sm">0.0453</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">Price range:</div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">
                  2377.84049 - 2452.67001 USDC per ETH
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[#F95465] text-sm">
                Amount Slippage Tolerance
              </div>
              <div className="flex items-center">
                <span className="text-[#F95465] text-sm">0.3%</span>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base font-medium">You'll receive</div>
      </div>

      <div className="bg-background-primary p-5 rounded-lg flex flex-col gap-y-4">
        {renderPeriod()}
      </div>
    </div>
  );
};

export default PriceSummary;
