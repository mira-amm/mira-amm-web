import {createConfig} from "fuels";

export default createConfig({
  contracts: ["../contracts"],
  scripts: ["../scripts"],
  output: "./src/sdk/typegen",
  forcBuildFlags: ["--release"],
});
