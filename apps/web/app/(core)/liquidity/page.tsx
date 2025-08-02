import {Pools} from "@/src/components/pages/liquidity-page/components/Pools/Pools";
import {Positions} from "@/src/components/pages/liquidity-page/components/Positions/Positions";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import {Boosts} from "@/src/components/pages/liquidity-page/components/Boosts/Boosts";
import {BrandText} from "@/src/components/common";

import {
  LIQUIDITY_PROVIDING_DOC_URL,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";
import {PromoSparkle} from "@/meshwave-ui/src/components/icons";

export default function Page() {
  return (
    <div className="flex flex-col w-full gap-y-6">
      <Boosts />
      <Positions />
      <Pools />
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5 w-full">
        <div className="w-full lg:w-1/2">
          <PromoBlock
            icon={<PromoSparkle />}
            title="Learn about providing liquidity"
            link={LIQUIDITY_PROVIDING_DOC_URL}
            linkText="Click here to see the guide"
            background="black"
          />
        </div>
        <div className="w-full lg:w-1/2">
          <PromoBlock
            icon={<PromoSparkle />}
            title={
              <BrandText
                mira="Mira Points Program"
                microchain="Microchain Points Program"
              />
            }
            link={POINTS_LEARN_MORE_URL}
            linkText={
              <BrandText
                mira="Learn about Mira Points"
                microchain="Learn about Microchain Points"
              />
            }
            background="black"
          />
        </div>
      </div>
    </div>
  );
}
