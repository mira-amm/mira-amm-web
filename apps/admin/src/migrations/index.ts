import * as migration_20250519_085113 from "./20250519_085113";
import * as migration_20250715_041648 from "./20250715_041648";

export const migrations = [
  {
    up: migration_20250519_085113.up,
    down: migration_20250519_085113.down,
    name: "20250519_085113",
  },
  {
    up: migration_20250715_041648.up,
    down: migration_20250715_041648.down,
    name: "20250715_041648",
  },
];
