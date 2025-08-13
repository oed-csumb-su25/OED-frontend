/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Defines a time-based conversion segment with a slope, intercept, note
 * and optional week pattern for a given time range.
 */
export interface ConversionSegmentData {
	sourceId: number;
	destinationId: number;
	startTime: string;
	endTime: string;
	slope: number;
	intercept: number;
	weekPatternsId: number;
	note: string;
}

/**
 * Payload used when updating an existing conversion segment.
 * Includes the original start and end times to uniquely identify
 * the segment in the database, since startTime and endTime are part of the primary key.
 */
export interface UpdateConversionSegmentPayload extends ConversionSegmentData {
	originalStartTime: string;
	originalEndTime: string;
}

// TODO add comment
export interface SplitConversionSegmentPayload {
	sourceId: number;
	destinationId: number;
	startTime: string;
	endTime: string;
	splitTime: string;
	newSlope: number;
	newIntercept: number;
	newWeekPatternsId: number;
	newNote?: string;
}
