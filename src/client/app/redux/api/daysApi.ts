/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { Day } from '../../types/redux/days';
import { baseApi } from './baseApi';

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
				url: 'api/days/addDay',
				method: 'POST',
				body: dailyPattern
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['DailyPattern']
		}),
		editDailyPattern: builder.mutation<void, { id: number; dayName?: string; note?: string }>({
			query: dailyPattern => ({
				url: 'api/days/edit',
				method: 'POST',
				body: dailyPattern
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['DailyPattern']
		}),
		deleteDailyPattern: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/days/delete',
				method: 'POST',
				body: { id }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['DailyPattern']
		})
	})
});

export const selectDaysQueryState = daysApi.endpoints.getDailyPatterns.select();
export const selectAllDays = createSelector(
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
