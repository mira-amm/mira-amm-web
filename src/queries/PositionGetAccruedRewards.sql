-- let pending_reward = (end - start) * campaign.reward_rate * position.amount_deposited;

-- // Accumulated reward is the reward generated before the campaign was updated last
-- let reward_debt = storage.reward_debt.get((position_id, campaign_id)).read();
-- let accumulated_reward = campaign.accumulated_reward_per_share * position.amount_deposited - reward_debt;

-- Some(accumulated_reward + pending_reward)


-- For the position, we need to know 

-- How much rewards has the campaign given out already (not necessarily claimed)
-- We cannot simply get the total rewards multiplied by the percentage of time that has elasped because the amount being rewarded for each unit of time is not constant.
-- Every time the reward rate changes, we save the rewards distributed up to that point
-- CampaignHistory Entity
-- reward_rate
-- start_time (when the campaign was last last updated)
-- end_time (when the campaign was last updated)
c AS (
    SELECT
        SUM(reward_rate * (end_time - start_time)) AS total_rewards_distributed
    FROM CampaignHistory
    WHERE campaign_id = '${campaignId}'
),
-- We need to get the accumulated rewards since the campaign was updated to the current point in time
d AS (
    SELECT
        reward_rate * (current_timestamp() - last_update_time) AS accumulated_rewards
    FROM Campaign
    WHERE campaign_id = '${campaignId}'
)
-- We sum the two values to get the total rewards that have been distributed
SELECT
    c.total_rewards_distributed + d.accumulated_rewards AS total_rewards_distributed

