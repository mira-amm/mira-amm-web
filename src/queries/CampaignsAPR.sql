-- Pool ID: 0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82-0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false

-- Parameters
-- Campaign rewards amount
-- epoch start and end dates
-- poolId
-- ALL

-- CALCULATE TVL
-- SUM of
--  reserve0 * 10^-reverve0Decimal * asset0Price
--  reserve1 * 10^-reserve1Decimal * asset1Price
WITH
  pools AS (
    SELECT
      p.id,
      p.lpToken,
      p.asset0,
      p.asset1,
      LOWER(a0.symbol) AS asset0_symbol,
      LOWER(a1.symbol) AS asset1_symbol,
      a0.decimals AS asset0_decimals,
      a1.decimals AS asset1_decimals
    FROM
      Pool p
      JOIN VerifiedAsset a0 ON p.asset0 = a0.assetId
      JOIN VerifiedAsset a1 ON p.asset1 = a1.assetId
  ),
  hourly_prices AS (
    SELECT
      p.symbol AS symbol,
      argMin (price, time) AS price,
      toStartOfHour (MIN(time)) AS price_hour,
      toUnixTimestamp (price_hour) AS hour
    FROM
      VerifiedAsset va
      INNER JOIN token.prices p ON p.symbol = lower(va.symbol)
    GROUP BY
      p.symbol,
      toStartOfHour (p.time)
  ),
  hourly_pool_snapshot_priced AS (
    SELECT
      p.*,
      (hps.reserve0 / POW(10, p.asset0_decimals)) * COALESCE(
        pr0.price,
        lagInFrame (pr0.price, 1) IGNORE NULLS OVER (
          PARTITION BY
            p.asset0_symbol
          ORDER BY
            hps.timestamp
        )
      ) AS token_0_value,
      (hps.reserve1 / POW(10, p.asset1_decimals)) * COALESCE(
        pr1.price,
        lagInFrame (pr1.price, 1) IGNORE NULLS OVER (
          PARTITION BY
            p.asset1_symbol
          ORDER BY
            hps.timestamp
        )
      ) AS token_1_value,
      (hps.reserve0 / POW(10, p.asset0_decimals)) * COALESCE(
        pr0.price,
        lagInFrame (pr0.price, 1) IGNORE NULLS OVER (
          PARTITION BY
            p.asset0_symbol
          ORDER BY
            hps.timestamp
        )
      ) + (hps.reserve1 / POW(10, p.asset1_decimals)) * COALESCE(
        pr1.price,
        lagInFrame (pr1.price, 1) IGNORE NULLS OVER (
          PARTITION BY
            p.asset1_symbol
          ORDER BY
            hps.timestamp
        )
      ) AS total_value,
      (
        (hps.reserve0 / POW(10, p.asset0_decimals)) * COALESCE(
          pr0.price,
          lagInFrame (pr0.price, 1) IGNORE NULLS OVER (
            PARTITION BY
              p.asset0_symbol
            ORDER BY
              hps.timestamp
          )
        ) + (hps.reserve1 / POW(10, p.asset1_decimals)) * COALESCE(
          pr1.price,
          lagInFrame (pr1.price, 1) IGNORE NULLS OVER (
            PARTITION BY
              p.asset1_symbol
            ORDER BY
              hps.timestamp
          )
        )
      ) / hps.lpTokenSupply AS price_per_lp,
      hps.timestamp AS hour
    FROM
      PoolSnapshot hps
      JOIN pools p ON hps.pool = p.id
      LEFT JOIN hourly_prices pr0 ON p.asset0_symbol = pr0.symbol
      AND hps.timestamp = pr0.hour
      LEFT JOIN hourly_prices pr1 ON p.asset1_symbol = pr1.symbol
      AND hps.timestamp = pr1.hour
    WHERE
      hps.lpTokenSupply > 0
  ),
-- CALCULATE CampaignRewardsUSD
-- FUEL price * campaign rewards amount
TotalValueLocked as (
    select
        total_value as tvlUSD
    from hourly_pool_snapshot_priced
    where p.id = '${poolId}'
    order by hour desc
    limit 1
),
CampaignRewardsUSD as (
    select
        argMax(price, time) as campaignRewardsUSD
    from token.prices
    where symbol = 'fuel'
),
-- Epoch rate of return (ERR) = rewardsUSD/tvlUSD
EpochRateOfReturn as (
    SELECT
        campaignRewardsUSD / tvlUSD as ERR
    from TotalValueLocked, CampaignRewardsUSD
),
EpochDays as (
    SELECT DATEDIFF(day,
        ${epochStart}::timestamp,
        ${epochEnd}::timestamp
    ) AS days_between
)
-- APR = ERR * 365/epochDays
select
    ERR * 365 / (select * from EpochDays) as APR
from EpochRateOfReturn

