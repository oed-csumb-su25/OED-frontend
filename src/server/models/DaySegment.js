const database = require('./database');
const sqlFile = database.sqlFile;

class DaySegment {
    /**
     * @param {*} id This day_segments' id.
     * @param {*} day_pattern_id The foreign key to the day_patterns table represents the day the segment belongs to.
     * @param {*} start_hour The hour the segment starts at.
     * @param {*} end_hour The hour the segment ends at.
     * @param {*} slope The slope of the conversion.
     * @param {*} intercept The intercept of the conversion.
     * @param {*} note Comments by the admin.
     */
    constructor(id, day_pattern_id, start_hour, end_hour, slope, intercept, note) {
        this.id = id;
        this.day_pattern_id = day_pattern_id;
        this.start_hour = start_hour; 
        this.end_hour = end_hour;
        this.slope = slope;
        this.intercept = intercept;
        this.note = note;
    }
    /**
     * Returns a promise to create the day_segments table.
     * @param {*} conn The connection to use.
     * @returns {Promise.<>}
     */
    static createTable(conn) {
        return conn.none(sqlFile('daySegments/create_day_segments_table.sql'));
    }

    /**
     * Create a new DaySegment object from the row's data.
     * @param {*} row The row from which DaySegment will be created.
     * @returns the created DaySegment object.
     */
     static mapRow(row) {
        return new DaySegment(
            row.id,
            row.day_pattern_id,
            row.start_hour,
            row.end_hour,
            row.slope,
            row.intercept,
            row.note
        );
    }

    /**
     * Get all DaySegment objects
     * @param {*} conn The database connection to use.
     * @returns all DaySegment objects.
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('daySegments/get_all.sql'));
        return rows.map(DaySegment.mapRow);
    }

     /**
     * Returns a promise to insert this daySegment into the database
     * @param conn The database connection to use.
     * @returns {Promise.<>}
     */
     async insert(conn) {
        const daySegment = this;
        if (daySegment.id !== undefined) {
            throw new Error('Attempted to insert a daySegment that already has an ID');
        }
        
        const resp = await conn.one(sqlFile('daySegment/insert_new_day_segment.sql'), daySegment);
        this.id = resp.id;
    }   
    
    /**
     * Returns a promise to update an existing daySegment in the database.
     * @param conn the connection to use.
     * @returns {Promise.<>}
     */
    async update(conn) {
        const daySegment = this;
        if (daySegment.id === undefined) {
            throw new Error('Attempted to update a daySegment with no ID');
        }
        await conn.none(sqlFile('daySegment/update_day_segment.sql'), daySegment);
    }
}

module.exports = DaySegment;