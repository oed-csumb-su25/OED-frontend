/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { Day } from '../../types/redux/days';
import { baseApi } from './baseApi';

// Tag type for cache invalidation
export const daysApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDays: builder.query<Day[], void>({
			query: () => 'api/days',
			providesTags: result =>
				result
					? [...result.map(({ id }) => ({ type: 'Days' as const, id })), { type: 'Days', id: 'LIST' }]
					: [{ type: 'Days', id: 'LIST' }]
		}),
		getDayById: builder.query<Day, number>({
			query: id => `api/days/${id}`,
			providesTags: (result, error, id) => [{ type: 'Days', id }]
		}),
		addDay: builder.mutation<void, { name: string; slope: number; intercept: number; note?: string, segmentNote?: string }>({
			query: Day => ({
				url: 'api/days/addDay',
				method: 'POST',
				body: Day
			}),
			invalidatesTags: ['Days']
		}),
		editDay: builder.mutation<void, { id: number; name?: string; note?: string }>({
			query: Day => ({
				url: 'api/days/edit',
				method: 'POST',
				body: Day
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'Days', id: arg.id }]
		}),
		deleteDay: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/days/delete',
				method: 'POST',
				body: { id }
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'Days', id: arg.id }]
		})
	})
});

export const selectDaysQueryState = daysApi.endpoints.getDays.select();
export const selectAllDays = createSelector(
	selectDaysQueryState,
	({ data: days = [] }) => days
);

export const stableEmptyDays: Day[] = [];

export const {
	useGetDaysQuery,
	useGetDayByIdQuery,
	useAddDayMutation,
	useEditDayMutation,
	useDeleteDayMutation
} = daysApi;
