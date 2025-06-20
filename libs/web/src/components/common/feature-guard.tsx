"use client";
import {useIsRebrandEnabled} from "@/src/hooks";
import {PropsWithChildren, ReactNode} from "react";

type Props = {
  /**
   * The UI to render when the feature is disabled.
   */
  fallback?: ReactNode;
};

/**
 * FeatureGuard conditionally renders children based on useIsRebrandEnabled status.
 * When enabled, renders the children (new UI). When disabled, renders the fallback (old UI).
 *
 * @returns The appropriate UI based on useIsRebrandEnabled status
 */
export const FeatureGuard = ({
  fallback,
  children,
}: PropsWithChildren<Props>) => {
  const isRebrandEnabled = useIsRebrandEnabled();

  // Show new UI when feature is enabled
  if (isRebrandEnabled) {
    return children;
  }

  // Show old UI (fallback) when feature is disabled
  return fallback;
};
