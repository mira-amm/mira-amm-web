import { createConfig } from 'fuels';

export default createConfig({
  workspace: './tmp_abis/mira-v1-periphery',
  output: './sway_abis',
  forcBuildFlags: ['--release'],
  privateKey: '0x001'
});
