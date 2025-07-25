import {ReactNode} from "react";

export default function LiquidityLayout({children}: {children: ReactNode}) {
  return (
    <main className="w-full flex flex-col gap-6 pb-20 lg:max-w-[1084px] lg:mx-auto lg:pt-8">
      {children}
    </main>
  );
}
