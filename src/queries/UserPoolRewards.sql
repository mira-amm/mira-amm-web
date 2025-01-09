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
EarliestEpochEndOrNow AS (
    SELECT 
        CASE 
            WHEN now() < toDateTime64(${epochEnd}, 3, 'UTC') THEN toUnixTimestamp(now())
            ELSE toUnixTimestamp(toDateTime64(${epochEnd}, 3, 'UTC'))
        END AS SelectedTimestamp
),
SnapshotsCount AS (
    SELECT count(*) AS TotalSnapshots 
    FROM AssetBalancesAndTotalSupply
    -- WHERE distinct_id = toString(${userId})
    WHERE distinct_id = '${userId}'
)
SELECT
    (SUM(amount / totalSupply) / (SELECT TotalSnapshots FROM SnapshotsCount)) 
    * ${amount} * 
    ((SELECT SelectedTimestamp FROM EarliestEpochEndOrNow) -  toUnixTimestamp(toDateTime64(${epochStart}, 3, 'UTC'))) /
    (
        toUnixTimestamp(toDateTime64(${epochEnd}, 3, 'UTC')) - 
        toUnixTimestamp(toDateTime64(${epochStart}, 3, 'UTC'))
    ) AS ComputedValue
FROM AssetBalancesAndTotalSupply
WHERE distinct_id = '${userId}'