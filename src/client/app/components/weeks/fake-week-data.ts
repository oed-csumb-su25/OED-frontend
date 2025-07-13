import { Day } from '../../types/redux/days';
import { Week } from '../../types/redux/weeks';

// ! This file contains fake data for development purposes.
// ! It should be replaced with real data from the backend when available.

export const fakeDaysData: Day[] = [
	{
		id: '1',
		name: 'Weekday',
		note: 'Standard weekday pattern',
		segments: [
			{ id: '1-1', dayId: '1', hour: 0, slope: 0.5, intercept: 1, note: 'Midnight to morning' },
			{ id: '1-2', dayId: '1', hour: 8, slope: 0.7, intercept: 1.2, note: 'Morning to evening' },
			{ id: '1-3', dayId: '1', hour: 18, slope: 0.4, intercept: 0.8, note: 'Evening to midnight' }
		]
	},
	{
		id: '2',
		name: 'Weekend',
		note: 'Weekend pattern',
		segments: [
			{ id: '2-1', dayId: '2', hour: 0, slope: 0.3, intercept: 0.9, note: 'All day' }
		]
	}
];

export const fakeWeeksData: Week[] = new Array(6).fill(null).map((_, index) => ({
	id: index + 1,
	name: `Fake Week Pattern ${index + 1}`,
	note: 'This is a fake week pattern used for development purposes',
	sunday: fakeDaysData[1].id,
	monday: fakeDaysData[0].id,
	tuesday: fakeDaysData[0].id,
	wednesday: fakeDaysData[0].id,
	thursday: fakeDaysData[0].id,
	friday: fakeDaysData[0].id,
	saturday: fakeDaysData[1].id
}));
