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
	weekPatternsId: number | null;
	note: string;
}
