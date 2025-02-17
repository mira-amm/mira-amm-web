-- This query returns the sum of all hourly shares for each user in a given epoch and pool
-- The sum of all the hourly shares for each user should be 1 per hour that the epoch is active
-- If you multiply the shares by hourly reward rate, you get the expected rewards for each user

-- returns user's lpToken balance relative to the totalSupply
WITH AssetBalancesAndTotalSupply AS (
    SELECT
        hb.amount,
        hb.timestamp,
        hb.distinct_id,
        SUM(hb.amount) OVER (PARTITION BY hb.timestamp, hb.asset_id) AS total_supply
    FROM `fuel.hourly_balances` hb
    WHERE hb.timestamp >= ${epochStart}
                AND hb.timestamp < ${epochEnd}
    AND hb.asset_id = '${lpToken}'
    AND hb.amount > 0
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
Hours AS (
    SELECT 
        TIMESTAMPDIFF(HOUR, toDateTime64(${epochStart}, 1, 'UTC'), toDateTime64(${epochEnd}, 1, 'UTC')) AS hours_duration
),

-- get share of distributed supply per hour for the user
UserRewardsIntermediary AS (
    SELECT
        distinct_id,
        toFloat64(amount) / toFloat64(total_supply) AS user_share
    FROM AssetBalancesAndTotalSupply
),

-- The sum of user shares for each hour, this multiplied by hourly reward rate is the amount of expected rewards
HourlyUserShare AS (
    SELECT 
        SUM(user_share) AS hourly_user_share,
        distinct_id
    FROM UserRewardsIntermediary
    GROUP BY distinct_id
)

SELECT
    distinct_id,
    hourly_user_share
FROM
    HourlyUserShare