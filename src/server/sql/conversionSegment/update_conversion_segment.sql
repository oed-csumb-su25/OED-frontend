-- added functionality for the start_time to be updated, may need to adjust later

UPDATE conversion_segments
    SET 
        week_patterns_id = ${week_patterns_id},
        slope = ${slope},
        intercept = ${intercept},
        start_time = ${start_time},
        end_time = ${end_time},
        note = ${note}
    WHERE 
        source_id = ${source_id} 
        AND destination_id = ${destination_id} 
        AND start_time = ${start_time};