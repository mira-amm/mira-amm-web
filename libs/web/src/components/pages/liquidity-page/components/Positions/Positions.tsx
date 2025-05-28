import MobilePositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";
import DesktopPositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import {useIsConnected} from "@fuels/react";
import usePositions from "@/src/hooks/usePositions";
import PositionsLoader from "./PositionsLoader/PositionsLoader";
import DocumentIcon from "@/src/components/icons/DocumentIcon";
import {POSITIONS_SKELTON_COUNT} from "@/src/utils/constants";

export default function Positions() {
  const {isConnected} = useIsConnected();
  const {data, isLoading} = usePositions();

  return (
    <section className="flex flex-col gap-6">
      <p className="text-[20px] leading-6">Your Positions</p>
      {!isConnected || data?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl px-4 py-7 bg-background-grey-dark">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-11 w-11 flex items-center justify-center rounded-full text-content-primary"
              style={{
                background:
                  "linear-gradient(96.75deg, #befa15 -106.79%, #5872fc 48.13%, #c41cff 168.79%)",
              }}
            >
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
        </div>
      ) : data && data.length > 0 && !isLoading ? (
        <>
          <DesktopPositions positions={data} />
          <MobilePositions positions={data} />
        </>
      ) : (
        <PositionsLoader count={POSITIONS_SKELTON_COUNT} />
      )}
    </section>
  );
}
