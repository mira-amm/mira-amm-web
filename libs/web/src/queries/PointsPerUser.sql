-- This query returns the sum of all hourly shares for each user in a given epoch and pool
-- The sum of all the hourly shares for each user should be 1 per hour that the epoch is active
-- If you multiply the shares by hourly reward rate, you get the expected rewards for each user

WITH RewardRates AS (
    SELECT 
        tupleElement(lp_token, 1) AS asset_id,
        tupleElement(lp_token, 2) AS reward_rate
    FROM 
        (SELECT arrayZip(
            ${lpTokens}, 
            ${rewardRates}
        ) AS lp_token_rewards) 
    ARRAY JOIN lp_token_rewards AS lp_token
),

-- returns user's lpToken balance relative to the totalSupply
AssetBalancesAndTotalSupply AS (
    SELECT
        hb.amount,
        hb.timestamp,
        hb.distinct_id,
        hb.asset_id,
        SUM(hb.amount) OVER (PARTITION BY hb.timestamp, hb.asset_id) AS total_supply
    FROM `fuel.hourly_balances` hb
    JOIN RewardRates rr ON hb.asset_id = rr.asset_id
    WHERE hb.timestamp >= ${epochStart}
                AND hb.timestamp < ${epochEnd}
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
        asset_id,
        toFloat64(amount) / toFloat64(total_supply) AS user_share
    FROM AssetBalancesAndTotalSupply
),

-- The sum of user shares for each hour, this multiplied by hourly reward rate is the amount of expected rewards
HourlyUserShare AS (
    SELECT 
        SUM(user_share) AS hourly_user_share,
        distinct_id,
        asset_id
    FROM UserRewardsIntermediary
    GROUP BY distinct_id, asset_id
),

PointsPerUserPerAsset AS (
    SELECT
        distinct_id,
        asset_id,
        hourly_user_share * rr.reward_rate / 24 AS points
    FROM HourlyUserShare
    JOIN RewardRates rr ON HourlyUserShare.asset_id = rr.asset_id
    ORDER BY points DESC
),

PointsPerUser AS (
    SELECT
        distinct_id,
        SUM(points) AS total_points
    FROM PointsPerUserPerAsset
    GROUP BY distinct_id
    ORDER BY total_points DESC
)

SELECT
    distinct_id as address,
    total_points as points,
    row_number() OVER () AS rank
FROM
    PointsPerUser