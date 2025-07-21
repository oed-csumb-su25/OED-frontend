
CREATE TABLE IF NOT EXISTS conversion_segments (
    source_id INTEGER NOT NULL REFERENCES units(id),
    destination_id INTEGER NOT NULL REFERENCES units(id),
    week_patterns_id INTEGER REFERENCES week_patterns(id),
    slope FLOAT,
    intercept FLOAT,
    start_time TIMESTAMP DEFAULT '-infinity',
    end_time TIMESTAMP DEFAULT 'infinity',
    note TEXT,
    FOREIGN KEY (source_id, destination_id) REFERENCES conversions(source_id, destination_id),
    PRIMARY KEY (source_id, destination_id, start_time)
);