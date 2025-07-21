SELECT * FROM day_segments
WHERE day_id = ${day_id}
ORDER BY start_hour;