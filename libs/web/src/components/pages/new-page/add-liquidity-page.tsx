"use client";

import Link from "next/link";
import {ChevronLeft, CircleQuestionMark} from "lucide-react";
import CoinPair from "../../common/CoinPair/CoinPair";
import {CurrencyBox} from "../../common";
import {BN} from "fuels";
import LiquidityManager from "./new-components/liquidity-manager";
import { useState } from "react";
import { AprBadge } from "../../common/AprBadge/AprBadge";
const data = {
  pool: [
    {
      bits: "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82",
    },
    {
      bits: "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
    },
    false,
  ],
  isStablePool: false,
  formattedTvlValue: "3,149,119.82",
  positionPath:
    "/liquidity/add?pool=0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82-0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-false",
  assetA: {
    amount: "10.796519353",
    metadata: {
      name: "Fuel",
      symbol: "FUEL",
      decimals: 9,
      isLoading: false,
    },
    reserve: 182049602.31330854,
  },
  assetB: {
    amount: "0.093379",
    metadata: {
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      isLoading: false,
    },
    reserve: 1574561.279134,
  },
};

const data2 = {
  value: "",
  assetId: "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
  mode: "sell",
  balance: new BN(10),
  loading: false,
  usdRate: 3046.45,
};

const data3 = {
  aprValue: "2.76%",
  poolKey:
    "0xa0265fb5c32f6e8db3197af3c7eb05c48ae373605b8165b6f4a51c5b0ba4812e-0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false",
  tvlActual: 129563,
};
type TimePeriod =
  | {id: "0.30"; text: "0.30% fee tier (volatile pool)"}
  | {id: "0.05"; text: "0.05% fee tier (stable pool)"};

const AddLiquidityPage = () => {
  const {pool, isStablePool, formattedTvlValue, positionPath, assetA, assetB} =
    data;

  const {value, assetId, mode, balance, loading, usdRate} = data2;

  const {aprValue, poolKey, tvlActual} = data3;

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>({
    id: "0.30",
    text: "0.30% fee tier (volatile pool)",
  });

  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
      <Link
        href="/liquidity"
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back to Pool
      </Link>
      <section className="flex flex-col gap-3 desktopOnly">
        <div className="w-full p-4 rounded-[12px] flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
          <p className="text-base text-content-primary font-semibold leading-[19px] border-b border-content-grey-dark/40 pb-3">
            Add Liqudity
          </p>

          <div>
            <div className="text-content-primary mb-2 text-base">Selected Pair</div>
            <div className="flex items-center justify-between">
              <div className="flex items-start justify-between gap-2">
                <CoinPair
                  firstCoin={pool[0].bits}
                  secondCoin={pool[1].bits}
                  isStablePool={isStablePool}
                />
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-x-1">
                  <span className="text-content-primary">Estimated Apr</span>
                  <CircleQuestionMark className="size-4 text-content-primary bg-text-content-grey-dark" />
                </div>
                <AprBadge
                  aprValue={aprValue}
                  poolKey={poolKey}
                  tvlValue={tvlActual}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="border border-content-tertiary rounded-md flex w-full">
              {(
                [
                  {id: "0.30", text: "0.30% fee tier (volatile pool)"},
                  {id: "0.05", text: "0.05% fee tier (stable pool)"},
                ] as TimePeriod[]
              ).map((period, index, array) => (
                <button
                  key={period.id}
                  className={`px-3.5 py-2.5 text-sm font-medium transition-all w-1/2 ${
                    selectedPeriod.id === period.id
                      ? "bg-background-primary text-page-background"
                      : "text-background-primary"
                  } ${
                    index === 0
                      ? "rounded-l-md"
                      : index === array.length - 1
                        ? "rounded-r-md"
                        : ""
                  }`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period.text}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-content-primary text-base">Deposited amounts</div>

            <div className="space-y-2">
              <CurrencyBox
                value={value}
                assetId={assetId}
                balance={balance}
                setAmount={() => {}}
                loading={loading}
                onCoinSelectorClick={() => {}}
                usdRate={usdRate}
                className={""}
              />

              <CurrencyBox
                value={value}
                assetId={assetId}
                balance={balance}
                setAmount={() => {}}
                loading={loading}
                onCoinSelectorClick={() => {}}
                usdRate={usdRate}
                className={""}
              />
            </div>
          </div>

          <LiquidityManager />

          {/* Input Amounts Button */}
          <button className="w-full bg-accent-primary-2 text-accent-primary-1 py-4 rounded-lg text-lg transition-colors">
            Input amounts
          </button>
        </div>
      </section>
    </main>
  );
};

export default AddLiquidityPage;
