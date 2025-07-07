CREATE TABLE IF NOT EXISTS day_segments (
    id SERIAL PRIMARY KEY,
    day_pattern_id INTEGER NOT NULL REFERENCES day_pattern(id) ON DELETE CASCADE,
    start_hour INTEGER NOT NULL CHECK (start_hour >= 0 and start_hour <= 23),
    end_hour INTEGER NOT NULL CHECK (end_hour > 0 and end_hour <= 24),
    slope FLOAT NOT NULL,
    intercept FLOAT NOT NULL,
    note TEXT
);