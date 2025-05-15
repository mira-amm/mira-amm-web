import * as migration_20250514_180848 from './20250514_180848';
import * as migration_20250515_012340 from './20250515_012340';

export const migrations = [
  {
    up: migration_20250514_180848.up,
    down: migration_20250514_180848.down,
    name: '20250514_180848',
  },
  {
    up: migration_20250515_012340.up,
    down: migration_20250515_012340.down,
    name: '20250515_012340'
  },
];
