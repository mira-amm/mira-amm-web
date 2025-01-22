/*
 *   File loader to load data once at build time.
 */
const fs = require("fs");

export function loadFile(filepath: string) {
  return fs.readFileSync(filepath, "utf8");
}
