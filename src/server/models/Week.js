const database = require('./database');
const sqlFile = database.sqlFile;

class Week {
    /**
     * @param {*} id This week_pattern's id.
     * @param {*} week_name This week_pattern's name.
     * @param {*} note This week_pattern's note.
     * @param {*} sunday The id for sunday's day_pattern.
     * @param {*} monday The id for monday's day_pattern.
     * @param {*} tuesday The id for tuesday's day_pattern.
     * @param {*} wednesday The id for wednesday's day_pattern.
     * @param {*} thursday The id for thursday's day_pattern.
     * @param {*} friday The id for friday's day_pattern.
     * @param {*} saturday The id for saturday's day_pattern.
     */
    constructor(id, week_name, note, sunday, monday, tuesday, wednesday, thursday, friday, saturday) {
        this.id = id;
        this.week_name = week_name;
        this.note = note;
        this.sunday = sunday;
        this.monday = monday;
        this.tuesday = tuesday;
        this.wednesday = wednesday;
        this.thursday = thursday;
        this.friday = friday;
        this.saturday = saturday;
    }

    /**
     * Returns a promise to create the week_pattern table.
     * @param {*} conn The connection to use.
     * @returns {Promise.<>}
     */
    static createTable(conn) {
        return conn.none(sqlFile('week/create_week_pattern_table.sql'));
    }

    /**
     * Create a new Week object from row's data.
     * @param {*} row The row from which Week will be created.
     * @returns the created Week object.
     */
    static mapRow(row) {
        return new Week(row.id, 
            row.week_name, 
            row.note, 
            row.sunday, 
            row.monday, 
            row.tuesday, 
            row.wednesday, 
            row.thursday, 
            row.friday, 
            row.saturday
        );
    }

    /**
     * Get all Week objects
     * @param {*} conn The database connection to use.
     * @returns all Week objects.
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('week/get_all.sql'));
        return rows.map(Week.mapRow);
    }

    /**
     * Delete a week by ID.
     * @param {*} conn The connection to be used.
     * @param {*} id The id of the week to be deleted.
     * @returns {Promise.<void>}
     */
    static async delete(conn, id) {
        return conn.none(sqlFile('week/delete_week_pattern.sql'), {id});
    }
    /**
     * Returns a promise to insert this week into the database
     * @param conn The database connection to use.
     * @returns {Promise.<>}
     */
    async insert(conn) {
        const week = this;
        if (week.id !== undefined) {
            throw new Error('Attempted to insert a week that already has an ID');
        }
        
        const resp = await conn.one(sqlFile('week/insert_new_week_pattern.sql'), week);
        this.id = resp.id;
    }

    /**
     * Returns a promise to update an existing day in the database.
     * @param conn the connection to use.
     * @returns {Promise.<>}
     */
    async update(conn) {
        const week = this;
        if (week.id === undefined) {
            throw new Error('Attempted to update a week with no ID');
        }
        await conn.none(sqlFile('week/update_week_pattern.sql'), week);
    }

} 

module.exports = Week;