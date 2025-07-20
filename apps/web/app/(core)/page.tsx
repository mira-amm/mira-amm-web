"use client";
import {useIsConnected} from "@fuels/react";
import {FeatureGuard} from "@/src/components/common";
import {Swap} from "@/src/components/common/Swap/Swap";

const SVGComponent = (props) => (
  <svg
    width={800}
    height={300}
    viewBox="0 0 800 300"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <radialGradient
        id="grad-green"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#7EEAC0" stopOpacity={1} />
        <stop offset="80%" stopColor="#7EEAC0" stopOpacity={0} />
      </radialGradient>
      <radialGradient
        id="grad-red"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#FF7A7A" stopOpacity={1} />
        <stop offset="80%" stopColor="#FF7A7A" stopOpacity={0} />
      </radialGradient>
      <radialGradient
        id="grad-blue"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#93AFFF" stopOpacity={1} />
        <stop offset="80%" stopColor="#93AFFF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={250} cy={150} r={200} fill="url(#grad-green)" />
    <circle cx={400} cy={150} r={200} fill="url(#grad-red)" />
    <circle cx={550} cy={150} r={200} fill="url(#grad-blue)" />
  </svg>
);

export default function Page() {
  const {isConnected} = useIsConnected();
  return (
    <div className="flex flex-1 flex-col items-center w-full md:justify-center">
      <div className="w-full max-w-lg px-4 relative">
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
