#!/bin/bash

set -ex

rm -rf packages/mira-v1/sway-abis
mkdir -p tmp_abis
cd tmp_abis

echo "Fetching latest Mira v1 core and periphery sources"
git clone git@github.com:mira-amm/mira-v1-core.git
git clone git@github.com:mira-amm/mira-v1-periphery.git

echo "Building Mira v1 core and periphery"
cd mira-v1-core
git checkout mainnet-deployment
forc build --release
cd ../mira-v1-periphery
forc build --release

cd ../..

mkdir -p packages/mira-v1/sway-abis/mira_amm_contract
mkdir -p packages/mira-v1/sway-abis/add_liquidity_script
mkdir -p packages/mira-v1/sway-abis/create_pool_and_add_liquidity_script
mkdir -p packages/mira-v1/sway-abis/remove_liquidity_script
mkdir -p packages/mira-v1/sway-abis/swap_exact_input_script
mkdir -p packages/mira-v1/sway-abis/swap_exact_output_script

mv -f tmp_abis/mira-v1-core/contracts/mira_amm_contract/out/release/ packages/mira-v1/sway-abis/mira_amm_contract
mv -f tmp_abis/mira-v1-periphery/scripts/add_liquidity_script/out/release/ packages/mira-v1/sway-abis/add_liquidity_script
mv -f tmp_abis/mira-v1-periphery/scripts/create_pool_and_add_liquidity_script/out/release/ packages/mira-v1/sway-abis/create_pool_and_add_liquidity_script
mv -f tmp_abis/mira-v1-periphery/scripts/remove_liquidity_script/out/release/ packages/mira-v1/sway-abis/remove_liquidity_script
mv -f tmp_abis/mira-v1-periphery/scripts/swap_exact_input_script/out/release/ packages/mira-v1/sway-abis/swap_exact_input_script
mv -f tmp_abis/mira-v1-periphery/scripts/swap_exact_output_script/out/release/ packages/mira-v1/sway-abis/swap_exact_output_script

rm -rf tmp_abis
