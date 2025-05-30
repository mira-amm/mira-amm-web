"use client";

import {ActionButton}from "@/src/components/common";
import { useCurrentRouter } from "@/src/hooks/useCurrentRouter";

export function LaunchAppButton({className, route}: {
  className?: string;
  route?: string[] 
}){
  const router = route ?? useCurrentRouter();

  const handleLaunchApp = () => {
    router.push("/swap");
  };

  return (
    <ActionButton className={className} onClick={handleLaunchApp}>
      Launch App
    </ActionButton>
  );
};
