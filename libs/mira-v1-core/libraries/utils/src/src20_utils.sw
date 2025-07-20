library;

use std::string::String;
use standards::src20::SRC20;
use interfaces::errors::InputError;

pub fn get_symbol_and_decimals(contract_id: ContractId, asset_id: AssetId) -> (String, u8) {
    let src_20 = abi(SRC20, contract_id.into());
    let symbol = src_20.symbol(asset_id);
    require(symbol.is_some(), InputError::AssetSymbolNotSet(asset_id));
    let decimals = src_20.decimals(asset_id);
    require(
        decimals
            .is_some(),
        InputError::AssetDecimalsNotSet(asset_id),
    );
    (symbol.unwrap(), decimals.unwrap())
}
