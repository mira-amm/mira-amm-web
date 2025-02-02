SELECT
    *
FROM Campaign c
    JOIN Pool p
        ON c.lpToken = p.lpToken
