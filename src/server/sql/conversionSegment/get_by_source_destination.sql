SELECT 
    source_id,
    destination_id,
    week_patterns_id,
    slope,
    intercept,
    start_time::TEXT AS start_time,
    end_time::TEXT AS end_time,
    note
FROM conversion_segments
WHERE source_id = ${sourceId} AND destination_id = ${destinationId}
ORDER BY start_time::TIMESTAMP ASC;