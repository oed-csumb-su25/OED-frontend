/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;
const { log } = require('../log');
const moment = require('moment');

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
		this.startTime = formatTimestampValue(startTime);
		this.endTime = formatTimestampValue(endTime);
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
	 * Creates a new conversion segment from the data in a row.
	 * @param {*} row The row from which the conversion segment will be created.
	 * @returns ConversionSegment
	 */
	static mapRow(row) {
		return new ConversionSegment(
			row.source_id, 
			row.destination_id, 
			row.week_patterns_id, 
			row.slope, 
			row.intercept, 
			row.start_time, 
			row.end_time, 
			row.note);
	}

	/**
	 * Returns a promise to get all conversion segments from the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<ConversionSegment>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversionSegment/get_all.sql'));
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Returns a promise to get all conversion segments with the given source id and destination id from the database. 
	 * If the conversion segment doesn't exist then return null.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestination(sourceId, destinationId, conn) {
		const rows = await conn.any(sqlFile('conversionSegment/get_by_source_destination.sql'), {
			sourceId: sourceId,
			destinationId: destinationId
		});
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Returns a promise to get the conversion segment associated with the given source id, destination id, startTime, and endTime from the database. 
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */



	static async getBySourceDestinationStartEnd(sourceId, destinationId, startTime, endTime, conn) {
		const row = await conn.one(sqlFile('conversionSegment/get_by_source_destination_start_end.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
		return ConversionSegment.mapRow(row);
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
	 * @param {*} originalStartTime The original start time of the segment being updated.
	 * @param {*} originalEndTime The original end time of the segment being updated.
	 * @param {*} conn The connection to use.
	 */
	async update(originalStartTime, originalEndTime, conn) {
		const conversionSegment = {
			...this,
			originalStartTime,
			originalEndTime
		};
		const startChanged = this.startTime !== originalStartTime
		const endChanged = this.endTime !== originalEndTime;

		// check that -infinity and infinity aren't being updated
		if ((startChanged && (originalStartTime === '-infinity')) || endChanged && (originalEndTime === 'infinity')) {
			const errMsg = `Cannot update starting time of -infinity or ending time of infinity`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		// update the previous segment's end time to the updated start time
		if (startChanged) {
				await conn.none(sqlFile('conversionSegment/update_prev_seg_end_to_new_start.sql'), conversionSegment);
		}

		// update the next segment's start time to the updated end time
		if (endChanged) {
			await conn.none(sqlFile('conversionSegment/update_next_seg_start_to_new_end.sql'), conversionSegment);
		}

		// Update the current segment
		await conn.none(sqlFile('conversionSegment/update_conversion_segment.sql'), conversionSegment);
}

	/**
	 * Deletes the conversion associated with the source, destination, start time, and end time from the database.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async delete(sourceId, destinationId, startTime, endTime, conn) {
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
	}

	/**
	 * Updates the start date of the following segment to the start date of the current segment before deleting the current segment.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async deleteAfter(sourceId, destinationId, startTime, endTime, conn) {
		// update the next segment start time
		await conn.none(sqlFile('conversionSegment/update_next_seg_start_to_curr_start.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});

		// delete segment
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
	}

	/**
	 * Updates the previous segment end time to the current segment end time before deleting the current segment.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async deleteEarlier(sourceId, destinationId, startTime, endTime, conn) {
		// update the previous segment end time
		await conn.none(sqlFile('conversionSegment/update_prev_seg_end_to_curr_end.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});

		// delete segment
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
	}
}

function formatTimestampValue(value) {
	if (value === 'infinity' || value === '-infinity') {
		return value;
	} 

	return moment(value).toISOString();
}

module.exports = ConversionSegment;