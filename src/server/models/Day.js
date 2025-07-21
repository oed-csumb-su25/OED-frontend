const database = require('./database');
const sqlFile = database.sqlFile;

class Day {
    /**
     * @param {*} id This day_patterns' id.
     * @param {*} day_name This day_pattern's name.
     * @param {*} note Comments by the admin.
     */
    constructor(id, day_name, note) {
        this.id = id;
        this.day_name = day_name;
        this.note = note;
    }

    /**
     * Returns a promise to create the day_patterns table.
     * @param {*} conn The connection to use.
     * @returns {Promise.<>}
     */
    static createTable(conn) {
        return conn.none(sqlFile('day/create_day_patterns_table.sql'));
    }

    /**
     * Create a new Day object from the row's data.
     * @param {*} row The row from which Day will be created.
     * @returns the created Day object.
     */
    static mapRow(row) {
        return new Day(
            row.id,
            row.day_name,
            row.note
        );
    }

    /**
     * Delete the day associated with the id
     * @param {*} id The day id.
     * @param {*} conn The connection to use.
     */
    static async delete(id, conn) {
        await conn.none(sqlFile('day/delete_day.sql'), {
            id: id
        });
    }

    /**
     * Get all Day objects
     * @param {*} conn The database connection to use.
     * @returns all Day objects.
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('day/get_all.sql'));
        return rows.map(Day.mapRow);
    }

    /** 
     * Returns the day associated the the id. If the day doesn't exist then return null.
     * @param {*} id The day id.
     * @param {*} conn The connection to use.
     * @returns {Promise.<Day>}
     */
    static async getById(id, conn) {
        const row = await conn.oneOrNone(sqlFile('day/get_by_id.sql'), {
            id: id
        });
        return row === null ? null : Day.mapRow(row);
    }

    /**
     * Insert this day into the database along with a default day segment.
     * The default day segment spans from 00:00 to 24:00.
     * Sets the day segments day_id property to the id of the newly created day.
     * 
     * @param conn The database connection to use.
     * @returns {Promise.<>}
     */
    async insert(slope, intercept, conn) {
        const day = this;
        if (day.id !== undefined) {
            throw new Error(`Attempted to insert a day that already has an ID ${day.id}`);
        }
        
        // insert new day
        const resp = await conn.one(sqlFile('day/insert_new_day_pattern.sql'), day);
        this.id = resp.id;

        // insert default day segment, including the new day id
        const defaultSegment = {
            day_id: this.id,
            start_hour: 0,
            end_hour: 24,
            slope: slope,
            intercept: intercept,
            note: this.note
        };

        await conn.none(sqlFile('daySegment/insert_new_day_segment.sql'), defaultSegment);
    }

    /**
     * Returns a promise to update an existing day in the database.
     * @param conn the connection to use.
     * @returns {Promise.<>}
     */
    async update(conn) {
        const day = this;
        if (day.id === undefined) {
            throw new Error('Attempted to update a day with no ID');
        }
        await conn.none(sqlFile('day/update_day_pattern.sql'), day);
    }
}

module.exports = Day;