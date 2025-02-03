-- Pending rewards is simpler than accrued rewards
-- We must assume whether reward rate is a function of outstanding shares or not
-- since the position is entitled to rewards based on how many other positions there are
 WITH a AS (
    SELECT
        amount_deposited,
        campaign_id
    FROM Position p
    WHERE p.id = '${positionId}'
), b AS (
    SELECT
        end_time,
        reward_rate,
        id AS campaign_id
    FROM Campaign c
    WHERE c.id = '${campaignId}'
)
SELECT
    (b.end_time - current_timestamp()) * b.reward_rate * a.amount_deposited AS pending_reward
FROM a
JOIN b
    ON a.campaign_id = b.campaign_id;
