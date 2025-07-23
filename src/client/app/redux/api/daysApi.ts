import { createSelector } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import { Day } from '../../types/redux/days';

// Tag type for cache invalidation
export const daysApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDailyPatterns: builder.query<Day[], void>({
			query: () => 'api/days',
			providesTags: ['DailyPattern']
		}),
		getDailyPatternById: builder.query<Day, number>({
			query: id => `api/days/${id}`,
			providesTags: (result, error, id) => [{ type: 'DailyPattern', id }]
		}),
		addDailyPattern: builder.mutation<void, { dayName: string; slope: number; intercept: number; note?: string, segmentNote?: string }>({
			query: dailyPattern => ({
				url: 'api/days/add',
				method: 'POST',
				body: dailyPattern
			}),
			invalidatesTags: ['DailyPattern']
		}),
		editDailyPattern: builder.mutation<void, { id: number; dayName?: string; note?: string }>({
			query: dailyPattern => ({
				url: 'api/days/edit',
				method: 'POST',
				body: dailyPattern
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DailyPattern', id: arg.id }]
		}),
		deleteDailyPattern: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/days/delete',
				method: 'POST',
				body: { id }
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DailyPattern', id: arg.id }]
		})
	})
});

export const selectDaysQueryState = daysApi.endpoints.getDailyPatterns.select();
export const selectDays = createSelector(
	selectDaysQueryState,
	({ data: days = [] }) => days
);

export const stableEmptyDays: Day[] = [];

export const {
	useGetDailyPatternsQuery,
	useGetDailyPatternByIdQuery,
	useAddDailyPatternMutation,
	useEditDailyPatternMutation,
	useDeleteDailyPatternMutation
} = daysApi;