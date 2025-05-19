import * as migration_20250519_085113 from './20250519_085113';

export const migrations = [
  {
    up: migration_20250519_085113.up,
    down: migration_20250519_085113.down,
    name: '20250519_085113'
  },
];
