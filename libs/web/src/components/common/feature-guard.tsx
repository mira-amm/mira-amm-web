"use client";

import {useIsRebrandEnabled} from "@/src/hooks";
import {PropsWithChildren, ReactNode} from "react";

/**
 * FeatureGuard conditionally renders children based on useIsRebrandEnabled status.
 * When enabled, renders the children (new UI). When disabled, renders the fallback (old UI).
 *
 * @returns The appropriate UI based on useIsRebrandEnabled status
 */
export const FeatureGuard = ({
  fallback,
  children,
}: PropsWithChildren<{
  fallback?: ReactNode;
}>) => {
  const isRebrandEnabled = useIsRebrandEnabled();

  if (isRebrandEnabled) {
    return children;
  }

  return fallback;
};
