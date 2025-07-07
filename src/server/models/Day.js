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
     * Get all Day objects
     * @param {*} conn The database connection to use.
     * @returns all Day objects.
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('day/get_all.sql'));
        return rows.map(Day.mapRow);
    }

    /**
     * Returns a promise to insert this day into the database
     * @param conn The database connection to use.
     * @returns {Promise.<>}
     */
    async insert(conn) {
        const day = this;
        if (day.id !== undefined) {
            throw new Error('Attempted to insert a day that already has an ID');
        }
        
        const resp = await conn.one(sqlFile('day/insert_new_day_pattern.sql'), day);
        this.id = resp.id;
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