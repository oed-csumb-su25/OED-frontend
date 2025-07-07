const { start } = require('repl');
const database = require('./database');
const sqlFile = database.sqlFile;

class ConversionSegment {
    /**
     * @param {*} source_id The unit id of the source.
     * @param {*} destination_id The unit id of the destination.
     * @param {*} week_patterns_id The foreign key to the week_patterns if a pre-existing pattern is selected.
     * @param {*} slope The slope of the conversion.
     * @param {*} intercept The intercept of the conversion.
     * @param {*} start_time The hour the segment starts.
     * @param {*} end_time The hour the segment ends.
     * @param {*} note Comments by the admin or OED inserted.
     */
    constructor(source_id, destination_id, week_patterns_id, slope, intercept, start_time, end_time, note) {
        this.source_id = source_id;
        this.destination_id = destination_id;
        this.week_patterns_id = week_patterns_id;
        this.slope = slope;
        this.intercept = intercept;
        this.start_time = start_time;
        this.end_time = end_time;
        this.note = note;
    }

	/**
	 * Returns a promise to create the conversion_segments table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('conversionSegments/create_conversion_segments_table.sql'));
	}

	/**
	 * Creates a new conversion segment from the row's data.
	 * @param {*} row The row from which the conversion segment will be created.
	 * @returns The new conversion segment object.
	 */
	static mapRow(row) {
		return new ConversionSegment(row.source_id, row.destination_id, row.week_patterns_id, row.slope, row.intercept, row.start_time, row.end_time, row.note);
	}

	/**
	 * Get all conversion segments in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<ConversionSegment>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversionSegments/get_all.sql'));
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Inserts a new conversion segment to the database.
	 * @param {*} conn The connection to use.
	 */
	async insert(conn) {
		const conversionSegment = this;
		await conn.none(sqlFile('conversionSegments/insert_new_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Updates an existed conversion segment in the database.
	 * @param {*} conn The connection to use.
	 */
	async update(conn) {
		const conversionSegment = this;
		await conn.none(sqlFile('conversionSegments/update_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Deletes the conversion associated with source, destination, and start_time from the database.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
     * @param {*} start_time The time the segment starts.
	 * @param {*} conn The connection to use.
	 */
	static async delete(source, destination, start_time, conn) {
		await conn.none(sqlFile('conversionSegments/delete_conversion_segment.sql'), {
			source: source,
			destination: destination,
            start_time: start_time
		});
	}
}

module.exports = ConversionSegment;