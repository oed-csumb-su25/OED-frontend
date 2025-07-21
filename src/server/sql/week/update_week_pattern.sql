-- Does not return a value

UPDATE week_patterns
    SET week_name = ${week_name},
        note = ${note},
        sunday = ${sunday},
        monday = ${monday},
        tuesday = ${tuesday},
        wednesday = ${wednesday},
        thursday = ${thursday},
        friday = ${friday},
        saturday = ${saturday}
    WHERE  id = ${id};