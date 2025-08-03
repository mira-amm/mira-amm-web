"use client";

import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import {PropsWithChildren, ReactNode} from "react";

/**
 * FeatureGuard conditionally renders children based on getIsRebrandEnabled status.
 * When enabled, renders the children (new UI). When disabled, renders the fallback (old UI).
 *
 * @returns The appropriate UI based on getIsRebrandEnabled status
 */
export const FeatureGuard = ({
  fallback,
  children,
}: PropsWithChildren<{
  fallback?: ReactNode;
}>) => {
  const rebrandEnabled = getIsRebrandEnabled();

  if (rebrandEnabled) {
    return children;
  }

  return fallback;
};
