import * as migration_20250419_035402 from './20250419_035402';

export const migrations = [
  {
    up: migration_20250419_035402.up,
    down: migration_20250419_035402.down,
    name: '20250419_035402'
  },
];
