/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class DaySegment {
	/**
	 * @param {*} id This day_segments' id.
	 * @param {*} dayId The foreign key to the day_patterns table represents the day the segment belongs to.
	 * @param {*} startHour The hour the segment starts at.
	 * @param {*} endHour The hour the segment ends at.
	 * @param {*} slope The slope of the conversion.
	 * @param {*} intercept The intercept of the conversion.
	 * @param {*} note Comments by the admin.
	 */
	constructor(id, dayId, startHour, endHour, slope, intercept, note) {
		this.id = id;
		this.dayId = dayId;
		this.startHour = startHour; 
		this.endHour = endHour;
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
		return conn.none(sqlFile('daySegment/create_day_segments_table.sql'));
	}

	/**
	 * Create a new DaySegment object from the row's data.
	 * @param {*} row The row from which DaySegment will be created.
	 * @returns the created DaySegment object.
	 */
	 static mapRow(row) {
		return new DaySegment(
			row.id,
			row.day_id,
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
		const rows = await conn.any(sqlFile('daySegment/get_all.sql'));
		return rows.map(DaySegment.mapRow);
	}

	/** 
	 * Returns the day segment associated the id. If the day segment doesn't exist then return null.
	 * @param {*} id The day segment id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<DaySegment>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('daySegment/get_by_id.sql'), {
			id: id
		});
		return row === null ? null : DaySegment.mapRow(row);
	}

	/** 
	 * Returns the day segments associated with the day id.
	 * @param {*} dayId The day pattern id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<DaySegment>}
	 */
	static async getByDayId(dayId, conn) {
		const rows = await conn.any(sqlFile('daySegment/get_by_dayId.sql'), {
			dayId: dayId
		});
		return rows.map(DaySegment.mapRow)
	}

	/**
	 * Returns a promise to insert the day segment.
	 * 
	 * @param {*} conn The connection to be used
	 * @returns {Promise.<void>}
	 */
	async insert(conn) {
		const daySegment = this;
		try {
			const resp =  await conn.none(sqlFile('daySegment/insert_new_day_segment.sql'), daySegment);
		} catch(err) {
			log.error(`Error while inserting day segment with error(s): ${err}`);
			failure(res, 500, `Error while inserting day segment with error(s): ${err}`);
		}
	}
	
	/**
	 * Returns a promise to update an existing daySegment in the database.
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(originalStartHour, originalEndHour, conn, res) {
		const daySegment = {
			...this,
			originalStartHour,
			originalEndHour
		};

		// check that 0 and 24 aren't being updated
		if ((this.startHour !== originalStartHour && originalStartHour === 0) || (this.endHour !== originalEndHour && originalEndHour === 24)) {
			log.error(`Cannot update starting hour of 0 or ending hour of 24`);
			failure(res, 500, `Cannot update staring hour of 0 or ending hour of 24`);
			return;
		}

		// Check and update previous segment's end time to updated start time
		if (this.startHour !== originalStartHour) {
			try {
				await conn.none(sqlFile('daySegment/update_prev_seg_end_to_new_start.sql'), daySegment);
			} catch(err) {
				log.error(`Error while updating previous segment with error(s): ${err}`);
				failure(res, 500, `Error while updating previous segment with error(s): ${err}`);
				return;
			}
		}

		// Check and update next segment's start time to updated end time
		if (this.endHour !== originalEndHour) {
			try {
				await conn.none(sqlFile('daySegment/update_next_seg_start_to_new_end.sql'), daySegment);
			} catch(err) {
				log.error(`Error while updating the next segments start time with error(s) ${err}`);
				failure(res, 500, `Error while updating the next segments start time with error(s) ${err}`);
				return;
			}
		}

		// update the current segment
		try {
			await conn.none(sqlFile('daySegment/update_day_segment.sql'), daySegment);
		} catch(err) {
			log.error(`Error while updating day segment with error(s): ${err}`);
			failure(res, 500, `Error while updating day segment with error(s): ${err}`);
		}
	}

	/**
	 * Delete the day segment associated with the id
	 * @param {*} id The day segment id.
	 * @param {*} conn The connection to use.
	 */
	static async delete(id, conn) {
		await conn.none(sqlFile('daySegment/delete_day_segment.sql'), {
			id: id
		});
	}
}

module.exports = DaySegment;