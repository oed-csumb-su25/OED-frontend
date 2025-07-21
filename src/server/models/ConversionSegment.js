/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class ConversionSegment {
    /**
     * @param {*} sourceId The unit id of the source.
     * @param {*} destinationId The unit id of the destination.
     * @param {*} weekPatternsId The foreign key to the week_patterns if a pre-existing pattern is selected.
     * @param {*} slope The slope of the conversion.
     * @param {*} intercept The intercept of the conversion.
     * @param {*} startTime The hour the segment starts.
     * @param {*} endTime The hour the segment ends.
     * @param {*} note Comments by the admin or OED inserted.
     */
    constructor(sourceId, destinationId, weekPatternsId, slope, intercept, startTime, endTime, note) {
        this.sourceId = sourceId;
        this.destinationId = destinationId;
        this.weekPatternsId = weekPatternsId;
        this.slope = slope;
        this.intercept = intercept;
        this.startTime = startTime;
        this.endTime = endTime;
        this.note = note;
    }

	/**
	 * Returns a promise to create the conversion_segments table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('conversionSegment/create_conversion_segments_table.sql'));
	}

	/**
	 * Creates a new conversion segment from the row's data.
	 * @param {*} row The row from which the conversion segment will be created.
	 * @returns The new conversion segment object.
	 */
	static mapRow(row) {
		return new ConversionSegment(row.sourceId, row.destinationId, row.weekPatternsId, row.slope, row.intercept, row.startTime, row.endTime, row.note);
	}

	/**
	 * Get all conversion segments in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<ConversionSegment>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversionSegment/get_all.sql'));
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Returns the conversion segment associated with source, destination, and startTime. If the conversion segment doesn't exist then return null.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
	 * @param {*} startTime The conversion segment start time
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestinationStart(source, destination, start, conn) {
		const row = await conn.oneOrNone(sqlFile('conversionSegment/get_by_source_destination_start.sql'), {
			source: source,
			destination: destination,
			startTime: start
		});
		return row === null ? null : ConversionSegment.mapRow(row);
	}

	/**
	 * Inserts a new conversion segment to the database.
	 * @param {*} conn The connection to use.
	 */
	async insert(conn) {
		const conversionSegment = this;
		await conn.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Updates an existed conversion segment in the database.
	 * @param {*} conn The connection to use.
	 */
	async update(conn) {
		const conversionSegment = this;
		await conn.none(sqlFile('conversionSegment/update_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Deletes the conversion associated with source, destination, and startTime from the database.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
     * @param {*} startTime The time the segment starts.
	 * @param {*} conn The connection to use.
	 */
	static async delete(source, destination, startTime, conn) {
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			source: source,
			destination: destination,
            startTime: startTime
		});
	}
}

module.exports = ConversionSegment;