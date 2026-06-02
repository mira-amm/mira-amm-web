"use client";

import Link from "next/link";
import {AlertTriangle, ArrowRight} from "lucide-react";

export function IndexerOutageBanner() {
  return (
    <section className="w-full bg-background-primary px-4 py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-lg border border-accent-alert/60 bg-background-grey-darker p-4 shadow-[0_16px_60px_rgba(0,0,0,0.28)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-accent-alert/60 bg-accent-alert/15 text-accent-alert">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-accent-alert/50 px-2 py-1 text-xs font-semibold uppercase leading-none text-accent-alert">
                Service interruption
              </span>
              <p className="text-lg font-semibold leading-6 text-content-primary">
                Indexer service is currently down
              </p>
            </div>
            <p className="text-sm leading-5 text-content-tertiary">
              Swaps, pool discovery, and indexed liquidity views are
              unavailable. The only operation available in this web interface is
              removing liquidity.
            </p>
          </div>
        </div>
        <Link
          href="/liquidity/remove-basic/"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent-primary px-5 py-3 text-sm font-semibold text-background-primary transition-opacity hover:opacity-90 sm:min-w-44"
        >
          Remove liquidity
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
