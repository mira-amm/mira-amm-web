"use client";

import {useIndexer as useIndexerContext} from "../providers/IndexerProvider";

export function useIndexerData() {
  return useIndexerContext();
}
