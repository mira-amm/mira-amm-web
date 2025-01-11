-- returns user's lpToken balance relative to the totalSupply
WITH AssetBalancesAndTotalSupply AS (
    SELECT
        hb.amount,
        hb.timestamp,
        hb.distinct_id,
        SUM(hb.amount) OVER (PARTITION BY hb.timestamp, hb.asset_id) AS totalSupply
    FROM `fuel.hourly_balances` hb
    WHERE hb.timestamp BETWEEN ${epochStart}
                AND ${epochEnd}
    AND hb.asset_id = '${lpToken}'
),
-- returns either the current time or the epoch end time (whichever is earlier)
EarliestEpochEndOrNow AS (
    SELECT
        CASE
            WHEN now() < toDateTime64(${epochEnd}, 3, 'UTC') THEN toUnixTimestamp(now())
            ELSE toUnixTimestamp(toDateTime64(${epochEnd}, 3, 'UTC'))
        END AS SelectedTimestamp
),
-- returns the number time periods
SnapshotsCount AS (
    SELECT count(*) AS TotalSnapshots
    FROM AssetBalancesAndTotalSupply
    WHERE distinct_id = '${userId}'
),
-- returns the number of fuel tokens the user has earned
UserFuelRewards AS (
    SELECT
        (SUM(amount / totalSupply) / (SELECT TotalSnapshots FROM SnapshotsCount))
        * ${lpTokenAmount} *
        ((SELECT SelectedTimestamp FROM EarliestEpochEndOrNow) -  toUnixTimestamp(toDateTime64(${epochStart}, 3, 'UTC'))) /
        (
            toUnixTimestamp(toDateTime64(${epochEnd}, 3, 'UTC')) -
            toUnixTimestamp(toDateTime64(${epochStart}, 3, 'UTC'))
        ) AS ComputedValue
    FROM AssetBalancesAndTotalSupply
    WHERE distinct_id = '${userId}'
),
-- get the latest fuel to USD price
LatestUSDPrice as (
    SELECT
        argMax(price, time) AS LatestUSDPrice
    FROM token.prices
    WHERE symbol = '${campaignRewardToken}'
)
SELECT
    ComputedValue AS FuelRewards,
    ComputedValue * (SELECT LatestUSDPrice FROM LatestUSDPrice) AS USDRewards
FROM UserFuelRewards