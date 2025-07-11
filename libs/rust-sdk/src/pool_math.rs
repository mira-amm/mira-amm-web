use crate::interface::{AmmFees, PoolId, PoolMetadata};
use anyhow::{ensure, Error};
use fuels::prelude::AssetId;
use primitive_types::U256;
use std::collections::HashMap;

fn rounding_up_division(nominator: U256, denominator: U256) -> U256 {
    let rounding_down_division_result = nominator / denominator;
    if nominator % denominator == U256::zero() {
        rounding_down_division_result
    } else {
        rounding_down_division_result + 1
    }
}

fn one_e_18() -> U256 {
    U256::from(1_000_000_000_000_000_000u64)
}

fn basis_points_denominator() -> U256 {
    U256::from(10_000)
}

fn is_stable(pool_id: &PoolId) -> bool {
    pool_id.2
}

fn pow_decimals(decimals: u8) -> U256 {
    U256::from(10).pow(decimals.into())
}

fn adjust(amount: U256, pow_decimals: U256) -> U256 {
    amount * one_e_18() / pow_decimals
}

fn d(x_0: U256, y: U256) -> U256 {
    U256::from(3) * x_0 * (y * y / one_e_18()) / one_e_18() + (x_0 * x_0 / one_e_18() * x_0 / one_e_18())
}

fn f(x_0: U256, y: U256) -> U256 {
    x_0 * (y * y / one_e_18() * y / one_e_18()) + (x_0 * x_0 / one_e_18() * x_0 / one_e_18()) * y
}

fn subtract_fee(amount: u64, fee: u64) -> u64 {
    amount - calculate_fee_to_subtract(amount, fee)
}

fn add_fee(amount: u64, fee: u64) -> u64 {
    amount + calculate_fee_to_add(amount, fee)
}

fn calculate_fee_to_subtract(amount: u64, fee_bp: u64) -> u64 {
    let nominator = U256::from(amount) * U256::from(fee_bp);
    let fee = rounding_up_division(nominator, basis_points_denominator());
    u64::try_from(fee).unwrap()
}

fn calculate_fee_to_add(amount: u64, fee_bp: u64) -> u64 {
    let nominator = U256::from(amount) * U256::from(fee_bp);
    let denominator = basis_points_denominator() - U256::from(fee_bp);
    let fee = rounding_up_division(nominator, denominator);
    u64::try_from(fee).unwrap()
}

fn get_y(x_0: U256, xy: U256, y: U256) -> Result<U256, Error> {
    let mut y: U256 = y;
    let mut i = 0;
    while i < 255 {
        let y_prev = y;
        let k = f(x_0, y);
        if k < xy {
            let d = d(x_0, y);
            ensure!(!d.is_zero(), "Router: GET_Y_FAILED");
            let dy = (xy - k) / d;
            y = y + dy;
        } else {
            let d = d(x_0, y);
            ensure!(!d.is_zero(), "Router: GET_Y_FAILED");
            let dy = (k - xy) / d;
            y = y - dy;
        }
        if y > y_prev {
            if y - y_prev <= U256::from(1) {
                return Ok(y);
            }
        } else {
            if y_prev - y <= U256::from(1) {
                return Ok(y);
            }
        }
        i += 1;
    }
    Ok(y)
}

fn k(
    is_stable: bool,
    x: U256,
    y: U256,
    pow_decimals_x: U256,
    pow_decimals_y: U256,
) -> U256 {
    if (is_stable) {
        let _x: U256 = x * one_e_18() / pow_decimals_x;
        let _y: U256 = y * one_e_18() / pow_decimals_y;
        let _a: U256 = (_x * _y) / one_e_18();
        let _b: U256 = ((_x * _x) / one_e_18() + (_y * _y) / one_e_18());
        _a * _b // x3y+y3x >= k
    } else {
        x * y // xy >= k
    }
}

pub fn get_amount_out(
    is_stable: bool,
    reserve_in: U256,
    reserve_out: U256,
    pow_decimals_in: U256,
    pow_decimals_out: U256,
    input_amount: U256,
) -> Result<U256, Error> {
    ensure!(input_amount > U256::zero(), "Router: ZERO_INPUT_AMOUNT");
    if is_stable {
        let xy: U256 = k(
            true,
            reserve_in,
            reserve_out,
            pow_decimals_in,
            pow_decimals_out,
        );

        let amount_in_adjusted = adjust(input_amount, pow_decimals_in);
        let reserve_in_adjusted = adjust(reserve_in, pow_decimals_in);
        let reserve_out_adjusted = adjust(reserve_out, pow_decimals_out);
        let y = reserve_out_adjusted - get_y(
            amount_in_adjusted + reserve_in_adjusted,
            xy,
            reserve_out_adjusted,
        )?;
        Ok(y * pow_decimals_out / one_e_18())
    } else {
        Ok(input_amount * reserve_out / (reserve_in + input_amount))
    }
}

pub fn get_amount_in(
    is_stable: bool,
    reserve_in: U256,
    reserve_out: U256,
    pow_decimals_in: U256,
    pow_decimals_out: U256,
    output_amount: U256,
) -> Result<U256, Error> {
    ensure!(output_amount > U256::zero(), "Router: ZERO_OUTPUT_AMOUNT");
    ensure!(reserve_out > output_amount, "Router: INVALID_OUTPUT_AMOUNT");
    if is_stable {
        let xy: U256 = k(
            true,
            reserve_in,
            reserve_out,
            pow_decimals_in,
            pow_decimals_out,
        );

        let amount_out_adjusted = adjust(output_amount, pow_decimals_out);
        let reserve_in_adjusted = adjust(reserve_in, pow_decimals_in);
        let reserve_out_adjusted = adjust(reserve_out, pow_decimals_out);
        let y = get_y(
            reserve_out_adjusted - amount_out_adjusted,
            xy,
            reserve_in_adjusted,
        )? - reserve_in_adjusted;
        Ok(
            rounding_up_division(y * pow_decimals_in, one_e_18())
        )
    } else {
        Ok(
            rounding_up_division(output_amount * reserve_in, reserve_out - output_amount)
        )
    }
}

pub fn get_amounts_out(
    fees: &AmmFees,
    amount_in: u64,
    asset_in: AssetId,
    pools: &Vec<PoolId>,
    pools_metadata: &HashMap<PoolId, PoolMetadata>,
) -> Result<Vec<(u64, AssetId)>, Error> {
    ensure!(pools.len() >= 1, "Router: INVALID_PATH");

    let AmmFees { lp_fee_volatile, lp_fee_stable, protocol_fee_volatile, protocol_fee_stable } = fees;
    let (stable_fee, volatile_fee) = (lp_fee_stable + protocol_fee_stable, lp_fee_volatile + protocol_fee_volatile);

    let mut amounts: Vec<(u64, AssetId)> = Vec::new();
    amounts.push((amount_in, asset_in));
    let mut i = 0;
    while i < pools.len() {
        let pool_id = pools.get(i).unwrap();
        let pool_opt = pools_metadata.get(pool_id);
        ensure!(pool_opt.is_some(), format!("Pool {:?} not present", pool_id));
        let pool = pool_opt.unwrap();
        let (amount_in, asset_in) = *amounts.get(i).unwrap();
        let fee = if is_stable(pool_id) {
            stable_fee
        } else {
            volatile_fee
        };
        let amount_out = if asset_in == pool_id.0 {
            get_amount_out(
                is_stable(pool_id),
                pool.reserve_0.into(),
                pool.reserve_1.into(),
                pow_decimals(pool.decimals_0),
                pow_decimals(pool.decimals_1),
                subtract_fee(amount_in, fee).into(),
            )
        } else {
            get_amount_out(
                is_stable(pool_id),
                pool.reserve_1.into(),
                pool.reserve_0.into(),
                pow_decimals(pool.decimals_1),
                pow_decimals(pool.decimals_0),
                subtract_fee(amount_in, fee).into(),
            )
        }?;

        let asset_out = if pool_id.0 == asset_in {
            pool_id.1
        } else {
            pool_id.0
        };
        let amount_out_u64 = u64::try_from(amount_out);
        ensure!(amount_out_u64.is_ok(), "Router: INVALID_AMOUNT_OUT");
        amounts.push((amount_out_u64.unwrap(), asset_out));
        i += 1;
    }
    Ok(amounts)
}

pub fn get_amounts_in(
    fees: &AmmFees,
    amount_out: u64,
    asset_out: AssetId,
    pools: &Vec<PoolId>,
    pools_metadata: &HashMap<PoolId, PoolMetadata>,
) -> Result<Vec<(u64, AssetId)>, Error> {
    ensure!(pools.len() >= 1, "Router: INVALID_PATH");

    let AmmFees { lp_fee_volatile, lp_fee_stable, protocol_fee_volatile, protocol_fee_stable } = fees;
    let (stable_fee, volatile_fee) = (lp_fee_stable + protocol_fee_stable, lp_fee_volatile + protocol_fee_volatile);

    let mut amounts: Vec<(u64, AssetId)> = Vec::new();
    amounts.push((amount_out, asset_out));
    let mut i = 0;
    while i < pools.len() {
        let pool_id = pools.get(pools.len() - 1 - i).unwrap();
        let pool_opt = pools_metadata.get(pool_id);
        ensure!(pool_opt.is_some(), format!("Pool {:?} not present", pool_id));
        let pool = pool_opt.unwrap();
        let (amount_out, asset_out) = *amounts.get(i).unwrap();
        let fee = if is_stable(pool_id) {
            stable_fee
        } else {
            volatile_fee
        };
        let amount_in = if asset_out == pool_id.0 {
            get_amount_in(
                is_stable(pool_id),
                pool.reserve_1.into(),
                pool.reserve_0.into(),
                pow_decimals(pool.decimals_1),
                pow_decimals(pool.decimals_0),
                amount_out.into(),
            )
        } else {
            get_amount_in(
                is_stable(pool_id),
                pool.reserve_0.into(),
                pool.reserve_1.into(),
                pow_decimals(pool.decimals_0),
                pow_decimals(pool.decimals_1),
                amount_out.into(),
            )
        }?;

        let asset_in = if pool_id.0 == asset_out {
            pool_id.1
        } else {
            pool_id.0
        };
        let amount_in_u64 = u64::try_from(amount_in);
        ensure!(amount_in_u64.is_ok(), "Router: INVALID_AMOUNT_IN");
        let amount_in_with_fee = add_fee(amount_in_u64.unwrap(), fee);
        amounts.push((amount_in_with_fee, asset_in));
        i += 1;
    }
    Ok(amounts)
}
