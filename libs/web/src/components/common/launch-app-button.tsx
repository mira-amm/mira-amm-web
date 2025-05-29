"use client";

import {useRouter} from "next/navigation";
import {ActionButton}from "@/src/components/common";

export function LaunchAppButton({className}: {
  className?: string;
}){
  const router = useRouter();

  const handleLaunchApp = () => {
    router.push("/swap");
  };

  return (
    <ActionButton className={className} onClick={handleLaunchApp}>
      Launch App
    </ActionButton>
  );
};
