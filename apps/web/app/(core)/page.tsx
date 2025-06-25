import { Swap } from "@/src/components/common/Swap/Swap";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col items-center w-full md:justify-center">
      <div className="w-full max-w-lg px-4">
        <Swap />
      </div>
    </div>
  );
}
