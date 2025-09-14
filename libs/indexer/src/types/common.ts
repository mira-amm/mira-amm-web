export enum ActionType {
  SWAP = "SWAP",
  JOIN = "JOIN",
  EXIT = "EXIT",
}

export enum EventType {
  SWAP = "swap",
  JOIN = "join",
  EXIT = "exit",
}

export type TimePeriod = "24h" | "7d" | "30d" | "all";

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface OrderByParams {
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

export interface TimeRange {
  from?: number;
  to?: number;
}

export interface Reserves {
  asset0: string | number;
  asset1: string | number;
}
