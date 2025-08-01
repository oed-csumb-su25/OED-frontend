/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const ConversionSegment = require('../models/ConversionSegment');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');
const moment = require('moment');
const { format } = require('path');

const router = express.Router();

function formatConversionSegmentForResponse(item) {
	return {
		sourceId: item.sourceId, 
		destinationId: item.destinationId, 
		weekPatternsId: item.weekPatternsId, 
		slope: item.slope, 
		intercept: item.intercept, 
		startTime: item.startTime, 
		endTime: item.endTime, 
		note: item.note
	};
}

/**
 * GET all conversion segments.
 */
router.get('/', adminAuthMiddleware('get all conversion segments'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await ConversionSegment.getAll(conn);
		res.json(rows.map(formatConversionSegmentForResponse));
	} catch (err) {
		log.error(`Error while performing GET all conversion segments query: ${err}`, err);
	}
});

/**
 * POST get all conversion segment(s) by source id and destination id.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 */
router.post('/sourceDestination', adminAuthMiddleware('get conversion segment(s) by source and destination id'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 2,
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: { 
				type: 'integer', 
				minimum: 0
			},
			destinationId: { 
				type: 'integer', 
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve conversion segment(s) by source id and destination id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const rows = await ConversionSegment.getBySourceDestination(
				req.body.sourceId, 
				req.body.destinationId, 
				conn
			);
			res.json(rows.map(formatConversionSegmentForResponse));
		} catch (err) {
			const errMsg = `Error while retrieving conversion segment by source id and destination id with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST get a conversion segment by source id, destination id, start time, and end time.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 */
router.post('/sourceDestinationStartEnd', adminAuthMiddleware('get conversion segment by source id, destination id, start time, and end time'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 4,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime'],
		properties: {
			sourceId: { 
				type: 'integer', 
				minimum: 0
			},
			destinationId: { 
				type: 'integer', 
				minimum: 0
			},
			startTime: { 
				type: 'string' 
			},
			endTime: {
				type: 'string'
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a conversion segment by source id, destination id, start time, and end time with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await ConversionSegment.getBySourceDestinationStartEnd(
				req.body.sourceId, 
				req.body.destinationId, 
				formatTimestampValue(req.body.startTime),
				formatTimestampValue(req.body.endTime),
				conn
			);
			res.json(formatConversionSegmentForResponse(row));
		} catch (err) {
			const errMsg = `Error while retrieving conversion segment by source id, destination id, start time, and end time with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST add conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {int} weekPatternsId The id of the weekly pattern.
 * @param {number} slope The slope for the conversion segment.
 * @param {number} intercept The intercept for the conversion segment.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 * @param {string} note Notes added by the admin for the conversion segment.
 */
router.post('/addConversionSegment', adminAuthMiddleware('add conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 8,
		required: ['sourceId', 'destinationId', 'slope', 'intercept', 'startTime', 'endTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			weekPatternsId: {
				oneOf: [
					{type: 'integer', minimum: 0},
					{type: 'null'}
				]
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			},
			note: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			}
		}
	};
	
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newConversionSegment = new ConversionSegment(
					req.body.sourceId, 
					req.body.destinationId, 
					req.body.weekPatternsId, 
					req.body.slope, 
					req.body.intercept, 
					formatTimestampValue(req.body.startTime),
					formatTimestampValue(req.body.endTime),
					req.body.note
				);
				await newConversionSegment.insert(t);
			});
			success(res, `Successfully added conversion segment`);
		} catch (err) {
			const errMsg = `Error adding conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST edit conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {int} weekPatternsId The id of the weekly pattern.
 * @param {number} slope The new slope for the conversion segment.
 * @param {number} intercept The new intercept for the conversion segment.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
 * @param {string} note The new note added by the admin for the conversion segment.
 * @param {string} originalStartTime The start time of the conversion segment before it is edited.
 * @param {string} originalEndTime The end time of the conversion segment before it is edited.
 */
router.post('/edit', adminAuthMiddleware('edit conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 10,
		required: ['sourceId', 'destinationId', 'slope', 'intercept', 'startTime', 'endTime', 'originalStartTime', 'originalEndTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			weekPatternsId: {
				oneOf: [
					{type: 'integer', minimum: 0},
					{type: 'null'}
				]
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			},
			note: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			originalStartTime: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			originalEndTime: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const updatedConversionSegment = new ConversionSegment(
					req.body.sourceId, 
					req.body.destinationId, 
					req.body.weekPatternsId, 
					req.body.slope, 
					req.body.intercept, 
					formatTimestampValue(req.body.startTime),
					formatTimestampValue(req.body.endTime),
					req.body.note
				);
				await updatedConversionSegment.update(
					formatTimestampValue(req.body.originalStartTime),
					formatTimestampValue(req.body.originalEndTime),
					t
				);
			});

			success(res, `Successfully edited conversion segment`);
		} catch (err) {
			const errMsg = `Error while editing conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
 */
router.post('/delete', adminAuthMiddleware('delete conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 4,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			}
		}
	};
	// Ensure conversion segment object is valid
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a conversion segment with invalid conversion segment data, error(s): ${err}`
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.delete(
				req.body.sourceId, 
				req.body.destinationId, 
				formatTimestampValue(req.body.startTime),
				formatTimestampValue(req.body.endTime),
				conn
			);
			success(res, 'Successfully deleted conversion segment');
		} catch (err) {
			const errMsg = `Error while deleting conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

function formatTimestampValue(value) {
	if (value === 'infinity' || value === '-infinity') {
		return value;
	} 

	return moment(value).toISOString();
}

module.exports = router;