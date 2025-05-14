import * as migration_20250514_180848 from './20250514_180848';

export const migrations = [
  {
    up: migration_20250514_180848.up,
    down: migration_20250514_180848.down,
    name: '20250514_180848'
  },
];
