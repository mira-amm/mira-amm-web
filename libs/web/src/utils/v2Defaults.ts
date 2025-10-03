// Centralized defaults for V2/bin-liquidity UI and mock values

import {DEFAULT_BIN_STEP} from "mira-dex-ts";

// Mock defaults
export const DEFAULT_MOCK_POOL_ID = "1001";
export const DEFAULT_LIQUIDITY_SHAPE = "curve" as const;
export const DEFAULT_PRICE_RANGE: [number, number] = [0.8, 1.2];
export const DEFAULT_CURRENT_PRICE = 1.0;

// UI defaults
export const UI_SLIDER_BIN_RANGE = 150; // Fixed range for slider
export const UI_INPUT_DEBOUNCE_MS = 400;
export const UI_PRICE_RANGE_PERCENT = 0.2; // 20%
export const UI_SLIDER_STEP = 0.001;
export const UI_DEFAULT_NUM_BINS = 2000;

// Strategy defaults
export const DEFAULT_BIN_STRATEGY = "single-active-bin";
export const DEFAULT_NUM_BINS = 1;

// Simulation defaults
export const SIM_DEFAULT_MIN_PRICE = 1200;
export const SIM_DEFAULT_MAX_PRICE = 1800;
export const SIM_MIN_RANGE = 200;
export const SIM_TOTAL_BARS = 120;

// Display defaults
export const DEFAULT_ASSET0_SYMBOL = "Asset X";
export const DEFAULT_ASSET1_SYMBOL = "Asset Y";
export const DEFAULT_ASSET_PRICE = 1.0;
export const DEFAULT_TOTAL_ASSET_AMOUNT = 1000;
