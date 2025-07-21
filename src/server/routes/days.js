const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Day = require('../models/Day');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;

const router = express.Router();

function formatDayForResponse(item) {
	return {
		id: item.id, 
        dayName: item.day_name, 
        note: item.note, 
	};
}

/**
 * Route for getting all days.
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Day.getAll(conn);
		res.json(rows.map(formatDayForResponse));
	} catch (err) {
		log.error(`Error while performing GET day details query: ${err}`);
	}
});

/**
 * Route for getting day by id.
 */
router.get('/:id', async (req, res) => {
	const dayId = parseInt(req.params.id);

	const conn = getConnection();
	try {
		const row = await Day.getById(dayId, conn);
		res.json(formatDayForResponse(row));
	} catch (err) {
		log.error(`Error while performing GET day details query: ${err}`);
	}
});

/**
 * Route for POST, edit day.
 */
router.post('/edit', async (req, res) => {
	const validDay = {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			dayName: {
				type: 'string',
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit days with invalid day data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit days with invalid day data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedDay = new Day(req.body.id, req.body.dayName, req.body.note);
			await updatedDay.update(conn);
		} catch (err) {
			log.error(`Error while editing day with error(s): ${err}`);
			failure(res, 500, `Error while editing day with error(s): ${err}`);
		}
		success(res);
	}
});

/**
 * Route for POST add day.
 * The slope and intercept are included to create a new day segment spanning from 0 to 24.
 */
router.post('/add', async (req, res) => {
	const validDay = {
		type: 'object',
		required: ['dayName', 'slope', 'intercept'],
		properties: {
			dayName: {
				type: 'string'
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

	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		log.error(`Got request to insert day with invalid day data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to insert day with invalid day data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newDay = new Day(
					undefined,
					req.body.dayName,
					req.body.note
				);
				await newDay.insert(req.body.slope, req.body.intercept, t);
			});
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while inserting new day with error(s): ${err}`);
			failure(res, 500, `Error while inserting new day with errors(s): ${err}`);
		}
	}
});

/**
 * Route for POST, delete day.
 */
router.post('/delete', async (req, res) => {
	const validDay = {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			}
		}
	};

	// Ensure day object is valid
	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		log.warn(`Got request to delete days with invalid day data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete days with invalid day data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Day.delete(req.body.id, conn);
		} catch (err) {
			log.error(`Error while deleting day with error(s): ${err}`);
			failure(res, 500, `Error while deleting day with errors(s): ${err}`);
		}
		success(res, 'Successfully deleted day');
	}
});

module.exports = router;
