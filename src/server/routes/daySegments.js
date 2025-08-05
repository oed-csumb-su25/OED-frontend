/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const DaySegment = require('../models/DaySegment');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatDaySegmentForResponse(item) {
	return {
		id: item.id, 
		dayId: item.dayId,
		startHour: item.startHour,
		endHour: item.endHour,
		slope: item.slope,
		intercept: item.intercept,
		note: item.note, 
	};
}

/**
 * GET all day segments.
 */
router.get('/', adminAuthMiddleware('get all day segments'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await DaySegment.getAll(conn);
		res.json(rows.map(formatDaySegmentForResponse));
	} catch (err) {
		log.error(`Error while performing GET day segment details query: ${err}`);
	}
});

/**
 * GET day segment by id
 */
router.get('/:id', adminAuthMiddleware('get day segment by id'), async(req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'string', 
				pattern: '^\\d+$'
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a day segment by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await DaySegment.getById(req.params.id, conn);
			res.json(formatDaySegmentForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET day segment by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * POST get all day segments by dayId
 * @param {integer} dayId The id for the day.
 */
router.post('/dayId', adminAuthMiddleware('get day segments by day id'), async(req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 1,
		required: ['dayId'],
		properties: {
			dayId: {
				type: 'integer', 
				minimum: 0
			}
		}
	};
	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve day segments by dayId with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const rows = await DaySegment.getByDayId(req.body.dayId, conn);
			res.json(rows.map(formatDaySegmentForResponse));
		} catch (err) {
			const errMsg = `Error while performing GET day segments by dayId: ${err}`;
			log.error(errMsg);
		}
	}
});

/**
 * POST add day segment.
 * @param {integer} dayId The id for the day.
 * @param {number} startHour The hour the day segment starts.
 * @param {number} endHour The hour the day segment ends.
 * @param {number} slope The slope of the day segment.
 * @param {number} intercept The intercept of the day segment.
 * @param {string} note The notes for the day segment.
 */
router.post('/addDaySegment', adminAuthMiddleware('add day segment'), async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 6,
		required: ['dayId', 'startHour', 'endHour', 'slope', 'intercept'],
		additionalProperties: false,
		properties: {
			dayId: {
				type: 'integer', 
				minimum: 0
			},
			startHour: {
				type: 'number',
				minimum: 0,
				maximum: 23
			},
			endHour: {
				type: 'number',
				minimum: 1,
				maximum: 24
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a day segment with invalid day segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		if (req.body.startHour >= req.body.endHour) {
			return failure(res, 400, `start hour must be less than end hour`);
		} else {
			const conn = getConnection();
			try {
				// use transaction to ensure consistent state
				await conn.tx(async t => {
					const newDaySegment = new DaySegment(
						undefined,
						req.body.dayId,
						req.body.startHour,
						req.body.endHour,
						req.body.slope,
						req.body.intercept,
						req.body.note
					);
					await newDaySegment.insert(t);
				});
				success(res, `Successfully added day segment`);
			} catch (err) {
				const errMsg = `Error while adding new day segment with error(s): ${err}`;
				log.error(errMsg);
				failure(res, 500, errMsg);
			}
		}
	}
});

/**
 * POST edit day segment.
 * @param {integer} dayId The id for the day.
 * @param {number} startHour The new hour the day segment starts.
 * @param {number} endHour The new hour the day segment ends.
 * @param {number} slope The new slope of the day segment.
 * @param {number} intercept The new intercept of the day segment.
 * @param {string} note The new notes for the day segment.
 * @param {number} originalStartHour The start hour of the day segment before it is edited.
 * @param {number} originalEndHour The end hour of the day segment before it is edited.
 */
router.post('/edit', adminAuthMiddleware('edit day segment'), async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 9,
		required: ['id', 'dayId', 'startHour', 'endHour', 'slope', 'intercept', 'originalStartHour', 'originalEndHour'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			},
			dayId: {
				type: 'integer', 
				minimum: 0
			},
			startHour: {
				type: 'number',
				minimum: 0,
				maximum: 23
			},
			endHour: {
				type: 'number',
				minimum: 1,
				maximum: 24
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			originalStartHour: {
				type: 'number',
				minimum: 0,
				maximum: 23
			},
			originalEndHour: {
				type: 'number',
				minimum: 1,
				maximum: 24		
			}
		}
	};

	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a day segment with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const updatedDaySegment = new DaySegment(
					req.body.id, 
					req.body.dayId,
					req.body.startHour,
					req.body.endHour,
					req.body.slope,
					req.body.intercept, 
					req.body.note
				);
				await updatedDaySegment.update(
					req.body.originalStartHour,
					req.body.originalEndHour,
					t
				);
			});

			success(res, `Successfully edited day segment`);
		} catch (err) {
			const errMsg = `Error while editing day segment with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete day segment.
 * @param {integer} id The id for the day segment to be deleted.
 */
router.post('/delete', adminAuthMiddleware('delete day segment'), async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			}
		}
	};

	// Ensure day segment object is valid
	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a day segment with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await DaySegment.delete(req.body.id, conn);
			success(res, 'Successfully deleted day segment');
		} catch (err) {
			const errMsg = `Error while deleting day segment with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete day segment after updating the end time of the previous segment to the end time of the deleted segment.
 * @param {integer} id The id for the day segment to be deleted.
 */
router.post('/deleteEarlier', adminAuthMiddleware('delete earlier day segment'), async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			}
		}
	};

	// Ensure day segment object is valid
	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete earlier day segment with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await DaySegment.deleteEarlier(req.body.id, conn);
			success(res, 'Successfully deleted earlier day segment.');
		} catch (err) {
			const errMsg = `Error while deleting earlier day segment with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});


/**
 * POST delete day segment after updating the start time of the following segment to the start time of the deleted segment.
 * @param {integer} id The id for the day segment to be deleted.
 */
router.post('/deleteLater', adminAuthMiddleware('delete later day segment'), async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			}
		}
	};

	// Ensure day segment object is valid
	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete later day segment with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await DaySegment.deleteLater(req.body.id, conn);
			success(res, 'Successfully deleted later day segment.');
		} catch (err) {
			const errMsg = `Error while deleting later day segment with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;