-- Insert a new week pattern into the week table
INSERT INTO week_patterns (
    week_name, 
    note, 
    sunday, 
    monday, 
    tuesday, 
    wednesday, 
    thursday, 
    friday, 
    saturday
) VALUES (
    ${week_name}, 
    ${note}, 
    ${sunday}, 
    ${monday}, 
    ${tuesday}, 
    ${wednesday}, 
    ${thursday}, 
    ${friday}, 
    ${saturday}
)
RETURNING id;