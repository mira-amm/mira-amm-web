import Link from "next/link";
import {
  POINTS_BANNER_SUBHEADER,
  POINTS_BANNER_TITLE,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";
import {PointsIcon} from "@/meshwave-ui/icons";
import {Button} from "@/meshwave-ui/Button";

export function BoostsBanner() {
  return (
    <div className="flex flex-col justify-between gap-2.5 p-4 rounded-[10px] bg-background-primary dark:bg-[linear-gradient(170deg,#262f5f_35%,#c41cff_100%)]">
      <PointsIcon />
      <h2 className="text-white">{POINTS_BANNER_TITLE}</h2>
      <div className="flex flex-wrap justify-between items-start gap-3">
        <p className="text-white text-base font-normal mr-2 text-left">
          {POINTS_BANNER_SUBHEADER}
        </p>
        <Link href={POINTS_LEARN_MORE_URL} target="_blank">
          <Button
            variant="secondary"
            className="relative inline-flex items-center text-white text-[16px] font-medium bg-transparent border-none cursor-pointer transition-colors duration-300 hover:text-[#e0e0e0]"
          >
            Learn more
            <span className="ml-1 transition-all duration-300 group-hover:ml-2 text-[18px]">
              &rarr;
            </span>
            <span className="absolute left-0 bottom-[-2px] w-full h-[2px] bg-white scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
