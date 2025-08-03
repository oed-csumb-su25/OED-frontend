/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { DaySegment, UpdateDaySegmentPayload } from '../../types/redux/days';
import { baseApi } from './baseApi';

// TODO: fix tags and invalidation
export const daySegmentsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDaySegments: builder.query<DaySegment[], void>({
			query: () => 'api/daySegments',
			providesTags: ['DaySegments']
		}),
		getDaySegmentsById: builder.query<DaySegment, number>({
			query: id => `api/daySegments/${id}`,
			providesTags: (result, error, id) => [{ type: 'DaySegments', id }]
		}),
		getDaySegmentsByDayId: builder.query<DaySegment[], number>({
			query: dayId => ({
				url: 'api/daySegments/dayId',
				method: 'POST',
				body: { dayId }
			}),
			providesTags: (result, error, dayId) => [{ type: 'DaySegments', dayId }]
		}),
		addDaySegment: builder.mutation<void, Omit<DaySegment, 'id'>>({
			query: daySegment => ({
				url: 'api/daySegments/addDaySegment',
				method: 'POST',
				body: daySegment
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['DaySegments']
		}),
		editDaySegment: builder.mutation<void, UpdateDaySegmentPayload>({
			query: daySegment => ({
				url: 'api/daySegments/edit',
				method: 'POST',
				body: daySegment
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', dayId: arg.dayId }]
		}),
		deleteDaySegments: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/daySegments/delete',
				method: 'POST',
				body: { id }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', id: arg.id }]
		})
	})
});

export const selectDaySegmentsQueryState = daySegmentsApi.endpoints.getDaySegments.select();
export const selectDaySegments = createSelector(
	selectDaySegmentsQueryState,
	({ data: daySegments = [] }) => daySegments
);

export const stableEmptyDaySegments: DaySegment[] = [];

export const {
	useGetDaySegmentsQuery,
	useGetDaySegmentsByIdQuery,
	useGetDaySegmentsByDayIdQuery,
	useAddDaySegmentMutation,
	useEditDaySegmentMutation,
	useDeleteDaySegmentsMutation
} = daySegmentsApi;
