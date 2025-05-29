"use client";

import { BackLink } from "@/src/components/common";
import Pools from "@/src/components/pages/liquidity-page/components/Pools/Pools";
import Positions from "@/src/components/pages/liquidity-page/components/Positions/Positions";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import {StarsIcon, CupIcon} from "@/meshwave-ui/icons";
import Boosts from "@/src/components/pages/liquidity-page/components/Boosts/Boosts";

import {
  LIQUIDITY_PROVIDING_DOC_URL,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";

export default function Page() {
  return (
    <>
      <BackLink />
      <Boosts />
      <Positions />
      <Pools />
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5 w-full">
        <div className="w-full lg:w-1/2">
          <PromoBlock
            icon={<StarsIcon />}
            title="Learn about providing liquidity"
            link={LIQUIDITY_PROVIDING_DOC_URL}
            linkText="Click here to see the guide"
          />
        </div>
        <div className="w-full lg:w-1/2">
          <PromoBlock
            icon={<CupIcon />}
            title="Mira Points Program"
            link={POINTS_LEARN_MORE_URL}
            linkText="Learn about Mira Points"
          />
        </div>
      </div>
    </>
  );
}
