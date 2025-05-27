import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function LiquidityLayout({ children }: Props) {
  return (
    <main className="flex flex-col gap-6 px-4 pb-20 lg:max-w-[1084px] lg:mx-auto lg:pt-8">
      {children}
    </main>
  );
}
