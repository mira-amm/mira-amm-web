WITH a AS (
    SELECT
        amount_deposited,
        campaign_id
    FROM Position p
    WHERE p.id = '${positionId}'
), b AS (
    SELECT
        end_time,
        start_time,
        reward_rate,
        id AS campaign_id
    FROM Campaign c
    WHERE c.id = '${campaignId}'
)
SELECT
    (b.end_time - b.start_time) * b.reward_rate * a.amount_deposited AS pending_reward
FROM a
JOIN b
    ON a.campaign_id = b.campaign_id;


-- let pending_reward = (end - start) * campaign.reward_rate * position.amount_deposited;
-- let reward_debt = storage.reward_debt.get((position_id, campaign_id)).read();
-- let accumulated_reward = campaign.accumulated_reward_per_share * position.amount_deposited - reward_debt;


