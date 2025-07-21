-- Does not return a value

UPDATE day_patterns
    SET day_name = ${day_name},
        note = ${note}
    WHERE id = ${id};