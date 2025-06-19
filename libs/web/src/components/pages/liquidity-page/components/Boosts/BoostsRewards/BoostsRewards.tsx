import Link from "next/link";
import {Info, Loader} from "@/src/components/common";
import {
  POINTS_TOOLTIP,
  POINTS_RANK_TOOLTIP,
  POINTS_LEARN_MORE_URL,
  DefaultLocale,
} from "@/src/utils/constants";
import {usePointsRank} from "@/src/hooks";
import {PointsIcon} from "@/meshwave-ui/icons";
import {Button} from "@/meshwave-ui/Button";
import clsx from "clsx";

export function BoostsRewards() {
  const {data: pointsRankArray, isLoading, error} = usePointsRank();

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  let pointsRank = {
    points: 0,
    rank: 0,
    address: "",
  };

  if (pointsRankArray && pointsRankArray.data.length > 0) {
    pointsRank = pointsRankArray.data[0];
  }

  return (
    <div className="flex flex-col gap-6 max-[480px]:gap-4">
      <div className="flex justify-between items-center">
        <p className="text-2xl">Points Program</p>
        <Link href={POINTS_LEARN_MORE_URL} target="_blank">
          <Button variant="outline">Learn more</Button>
        </Link>
      </div>

      <div
        className={clsx(
          "flex justify-between items-center gap-4 rounded-[10px] min-h-[110px] bg-background-primary dark:bg-[linear-gradient(170deg,#262f5f_35%,#c41cff_100%)] p-6",
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-base font-normal text-white/72">
            <p className="text-white">Your Points</p>
            <Info
              tooltipText={POINTS_TOOLTIP}
              tooltipKey="points"
              color="#D1D4F9"
            />
          </div>
          <div className="flex items-center gap-2 h-[25px]">
            {isLoading ? (
              <Loader color="gray" />
            ) : (
              <>
                <PointsIcon />
                <p className="text-[26px] font-normal max-[768px]:text-[20px]">
                  {pointsRank?.points.toLocaleString(DefaultLocale, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-9 ">
          <div className="w-0.5 bg-white/20 h-14" />
          <div className="flex flex-col gap-2 mr-[30px]">
            <div className="flex items-center gap-1 text-base font-normal text-white/72">
              <p className="text-white">Your rank</p>
              <Info
                tooltipText={POINTS_RANK_TOOLTIP}
                tooltipKey="rank"
                color="#D1D4F9"
              />
            </div>
            {isLoading ? (
              <Loader color="gray" />
            ) : (
              <p className="text-[20px] font-normal">{pointsRank?.rank}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
