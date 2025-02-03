WITH a AS (
    SELECT
        positionToken,
        amount_deposited,
        campaign_id
    FROM Position p
    WHERE p.recipient = '${recipient}'
), b AS (
    SELECT
        end_time,
        reward_rate,
        id AS campaign_id
    FROM Campaign c
), c AS (
    SELECT
        positionToken,
        (b.end_time - current_timestamp()) * b.reward_rate * a.amount_deposited AS pending_reward
    FROM a
    JOIN b
        ON a.campaign_id = b.campaign_id
), CampaignRewardsUSD as (
    SELECT
        symbol,
        argMax(price, time) AS conversion_rate
    FROM token.prices
    GROUP BY symbol
),
-- Might need to join with table to get symbol from token address
z AS (
    SELECT
        c.positionToken,
        c.pending_reward * cr.conversion_rate AS pending_reward_usd
    FROM c
    JOIN CampaignRewardsUSD cr
        ON c.symbol = cr.symbol
)
-- SUM
SELECT
    SUM(z.pending_reward_usd) AS pending_rewards_usd
FROM z;