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
TotalValueLocked AS (
    SELECT
        total_value AS tvlUSD
    FROM hourly_pool_snapshot_priced
    WHERE p.id = '${poolId}' and total_value > 0 -- workaround for bug
    ORDER BY hour DESC
    LIMIT 1
),
CampaignRewardsUSD as (
    SELECT
        ${campaignRewardsAmount} * argMax(price, time) AS campaignRewardsUSD
    FROM token.prices
    WHERE symbol = '${campaignRewardToken}'
),
EpochRateOfReturn AS (
    SELECT
        campaignRewardsUSD / tvlUSD AS ERR
    FROM TotalValueLocked, CampaignRewardsUSD
),
EpochDays as (
    SELECT DATEDIFF(day,
        ${epochStart}::timestamp,
        ${epochEnd}::timestamp
    ) AS days_between
)
SELECT
    ERR * 365 / (SELECT * FROM EpochDays) AS APR
FROM EpochRateOfReturn