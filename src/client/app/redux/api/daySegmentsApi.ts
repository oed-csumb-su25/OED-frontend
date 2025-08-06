/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DaySegment, UpdateDaySegmentPayload } from '../../types/redux/days';
import { baseApi } from './baseApi';

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
		deleteDaySegment: builder.mutation<void, DaySegment>({
			query: ({ dayId, startHour, endHour }) => ({
				url: 'api/daySegments/delete',
				method: 'POST',
				body: { dayId, startHour, endHour }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', dayId: arg.dayId }]
		}),
		// Deletes the provided day segment and updates the end hour of the previous segment
		deleteDaySegmentEarlier: builder.mutation<void, DaySegment>({
			query: ({ dayId, startHour, endHour }) => ({
				url: 'api/daySegments/deleteEarlier',
				method: 'POST',
				body: { dayId, startHour, endHour }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', dayId: arg.dayId }]
		}),
		// Deletes the provided day segment and updates the start hour of the next segment
		deleteDaySegmentLater: builder.mutation<void, DaySegment>({
			query: ({ dayId, startHour, endHour }) => ({
				url: 'api/daySegments/deleteLater',
				method: 'POST',
				body: { dayId, startHour, endHour }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', dayId: arg.dayId }]
		})
	})
});
