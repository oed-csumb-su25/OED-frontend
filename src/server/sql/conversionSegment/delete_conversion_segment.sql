DELETE FROM conversion_segments
WHERE source_id = ${source} AND destination_id = ${destination} AND start_time = ${start_time};