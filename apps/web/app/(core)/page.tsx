"use client";
import {FeatureGuard} from "@/src/components/common";
import {Swap} from "@/src/components/common/Swap/Swap";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col items-center w-full md:justify-center">
      <div className="w-full max-w-lg px-4">
        <Swap />
        <FeatureGuard>
          {isConnected && (
            <SVGComponent className="absolute w-[650px] -bottom-25 -left-18 -z-1" />
          )}
        </FeatureGuard>
      </div>
    </div>
  );
}
