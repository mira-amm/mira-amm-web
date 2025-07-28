// HACK: called from node environment via tsx
// TODO: run directly via tsup cli instead

import {rm} from "node:fs/promises";
import {replaceTscAliasPaths} from "tsc-alias";
import {type Options, build as tsupBuild} from "tsup";

async function build(): Promise<void> {
  const outDir = "api";
  const tsupOptions: Options = {
    entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],
    // entry: ["src/main.ts"],
    outDir: outDir,
    format: ["esm"],
    target: "esnext",
    platform: "node",
    bundle: false,
    minify: false,
    sourcemap: false,
    splitting: false,
    cjsInterop: false,
    dts: false,
    external: [],
    noExternal: [],
  };

  await rm(outDir, {recursive: true, force: true});
  await tsupBuild(tsupOptions);
  await replaceTscAliasPaths({outDir: outDir});
}

await build();
