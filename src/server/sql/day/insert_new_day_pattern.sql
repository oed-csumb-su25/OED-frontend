INSERT INTO day_patterns(day_name, note)
VALUES (${day_name}, ${note})
RETURNING id;