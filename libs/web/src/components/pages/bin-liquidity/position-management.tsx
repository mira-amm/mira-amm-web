// "use client";

// import Link from "next/link";
// import {ChevronLeft, Sparkles} from "lucide-react";
// import CoinPair from "../../common/CoinPair/CoinPair";
// import {Button} from "@/meshwave-ui/Button";
// import {NewReserveItem} from "./new-components/new-reserve-item";
// import NewPromoBlock from "./new-components/new-promo-block";
// import {useState} from "react";
// import {NewExchangeRate} from "./new-components/new-exchange-rate";
// import {cn} from "@/src/utils/cn";
// import SimulatedDistribution from "./new-components/simulated-distribution";
// import {MiraBlock} from "../view-position-page/components/PositionView/mira-block";

// const data = {
//   pool: [
//     {
//       bits: "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82",
//     },
//     {
//       bits: "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
//     },
//     false,
//   ],
//   isStablePool: false,
//   formattedTvlValue: "3,149,119.82",
//   positionPath:
//     "/liquidity/add?pool=0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82-0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-false&binned=true",
//   assetA: {
//     amount: "10.796519353",
//     metadata: {
//       name: "Fuel",
//       symbol: "FUEL",
//       decimals: 9,
//       isLoading: false,
//     },
//     reserve: 182049602.31330854,
//   },
//   assetB: {
//     amount: "0.093379",
//     metadata: {
//       name: "USDC",
//       symbol: "USDC",
//       decimals: 6,
//       isLoading: false,
//     },
//     reserve: 1574561.279134,
//   },
// };
// type TimePeriod = "24H" | "7D" | "30";

// const PositionManagementPage = () => {
//   const {pool, isStablePool, formattedTvlValue, positionPath, assetA, assetB} =
//     data;

//   const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("7D");

//   return (
//     <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
//       <Link
//         href="/liquidity"
//         className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
//       >
//         <ChevronLeft className="size-5" />
//         Back to pool
//       </Link>
//       <section className="flex flex-col gap-4">
//         <div className="flex justify-between items-center">
//           <div className="flex items-start justify-between gap-2">
//             <CoinPair
//               firstCoin={pool[0].bits}
//               secondCoin={pool[1].bits}
//               isStablePool={isStablePool}
//               withPoolDescription
//             />
//           </div>
//           <div className="flex items-center gap-2.5">
//             <Button variant="outline">Remove Liquidity</Button>
//             <Link href={positionPath}>
//               <Button>Add Liquidity</Button>
//             </Link>
//           </div>
//         </div>

//         <div className="flex gap-3 w-full">
//           <MiraBlock pool={pool} />
//           <div className="p-4 w-1/2 rounded-lg flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
//             <p className="text-base leading-[19px] border-b border-background-grey-light pb-3">
//               Pool reserves
//             </p>
//             <NewReserveItem
//               assetId={pool[0].bits}
//               amount={assetA.amount}
//               reserve={assetA.reserve}
//             />
//             <NewReserveItem
//               assetId={pool[1].bits}
//               amount={assetB.amount}
//               reserve={assetB.reserve}
//             />

//             <div className="flex flex-col gap-1 border-t border-background-grey-light pt-3">
//               <div className="flex items-center justify-between text-content-tertiary">
//                 {formattedTvlValue && (
//                   <p className="text-sm">Total value locked</p>
//                 )}
//                 {formattedTvlValue && (
//                   <p className="text-sm">${formattedTvlValue}</p>
//                 )}
//               </div>
//               <NewExchangeRate
//                 assetBMetadata={assetB.metadata}
//                 assetAMetadata={assetA.metadata}
//                 coinAAmount={assetA.amount}
//                 coinBAmount={assetB.amount}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="w-full p-4 rounded-lg flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
//           <div className="flex justify-between items-center">
//             <div className="text-content-primary text-base">Your liquidity</div>
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
//                 <span className="text-sm text-content-primary">UNI</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
//                 <span className="text-sm text-content-primary">ETH</span>
//               </div>
//             </div>
//           </div>

//           <div className="border-b pb-3 border-background-grey-light">
//             <SimulatedDistribution />
//           </div>

//           <NewReserveItem
//             assetId={pool[0].bits}
//             amount={assetA.amount}
//             reserve={assetA.reserve}
//           />
//           <NewReserveItem
//             assetId={pool[1].bits}
//             amount={assetB.amount}
//             reserve={assetB.reserve}
//           />

//           <div className="flex flex-col gap-[10px] border-t border-background-grey-light pt-3">
//             <div className="flex items-center justify-between">
//               {formattedTvlValue && (
//                 <p className="text-background-primary text-sm">
//                   Deposit balance:
//                 </p>
//               )}
//               {formattedTvlValue && (
//                 <p className="text-content-tertiary text-sm">
//                   ${formattedTvlValue}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="w-full p-4 rounded-lg flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-background-primary">Fees earned</div>
//               <div className="text-content-tertiary text-sm">
//                 Last refreshed on Jun 28 2025, 2:00PM
//               </div>
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <div className="h-[34px] border border-content-tertiary rounded-md flex">
//                   {(["24H", "7D", "30"] as TimePeriod[]).map(
//                     (period, index) => (
//                       <button
//                         key={period}
//                         className={cn(
//                           "px-3.5 py-1 text-sm font-medium transition-colors text-content-primary",
//                           selectedPeriod === period &&
//                             "bg-background-primary text-page-background",
//                           index === 1 && "border-x"
//                         )}
//                         onClick={() => setSelectedPeriod(period)}
//                       >
//                         {period}
//                       </button>
//                     )
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="w-full h-0.5 bg-content-grey-dark dark:bg-white opacity-10" />
//         </div>

//         <NewPromoBlock
//           icon={<Sparkles />}
//           title="Learn about providing liquidity"
//           link="https://mirror.xyz/miraly.eth"
//           linkText="Click here and check our v3 LP walkthrough"
//         />
//       </section>
//     </main>
//   );
// };

// export default PositionManagementPage;

const PositionManagementPage = () => {
  return (
    <div>
      <div>delete me</div>
    </div>
  );
};

export default PositionManagementPage;
