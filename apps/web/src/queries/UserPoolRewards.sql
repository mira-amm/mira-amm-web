-- returns user's lpToken balance relative to the totalSupply
WITH AssetBalancesAndTotalSupply AS (
    SELECT
        hb.amount,
        hb.timestamp,
        hb.distinct_id,
        SUM(hb.amount) OVER (PARTITION BY hb.timestamp, hb.asset_id) AS total_supply
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
Hours AS (
    SELECT 
        TIMESTAMPDIFF(HOUR, toDateTime64(${epochStart}, 1, 'UTC'), toDateTime64(${epochEnd}, 1, 'UTC')) AS hours_duration
),
-- get the amount of rewards distributed per hour
Supply AS (
    SELECT
        ${rewardsAmount} / (SELECT hours_duration FROM Hours) as hourly_supply
),
-- get share of distributed supply per hour for the user
UserRewardsIntermediary AS (
    SELECT
        toFloat64(amount) / toFloat64(total_supply) AS user_share
    FROM AssetBalancesAndTotalSupply
    WHERE distinct_id = '${userId}'
),
-- get the total rewards for the user
UserRewards AS (
    SELECT
        SUM(user_share  * (SELECT hourly_supply FROM Supply)) as user_rewards
    FROM 
        UserRewardsIntermediary
)

SELECT user_rewards as FuelRewards from UserRewards;
