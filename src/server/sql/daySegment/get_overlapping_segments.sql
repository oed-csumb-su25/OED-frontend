SELECT * FROM day_segments
WHERE day_id = ${day_id} AND start_hour < ${end_hour} AND end_hour > ${start_hour};