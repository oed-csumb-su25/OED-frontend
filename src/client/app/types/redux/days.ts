export interface Day {
	id: number;
	dayName: string;
	note: string;
	segments: DaySegment[];
}

export interface DaySegment {
	id: number;
	dayId: number;
	hour: number;
	slope: number;
	intercept: number;
	note?: string;
}

export interface CreateDaySegmentPayload {
	dayId: string;
	hour: number;
	slope: number;
	intercept: number;
	note?: string;
}

export interface UpdateDaySegmentPayload {
	id: string;
	hour: number;
	slope: number;
	intercept: number;
	note?: string;
}

export interface DeleteDaySegmentPayload {
	id: string;
}
