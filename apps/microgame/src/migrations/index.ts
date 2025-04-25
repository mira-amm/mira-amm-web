import * as migration_20250425_042903 from './20250425_042903';

export const migrations = [
  {
    up: migration_20250425_042903.up,
    down: migration_20250425_042903.down,
    name: '20250425_042903'
  },
];
