// Server component Suspense wrapper
import {Suspense} from "react";
import {Loader} from "@/src/components/common";

export function PageSuspense({children}: {children: React.ReactNode}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={true} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
