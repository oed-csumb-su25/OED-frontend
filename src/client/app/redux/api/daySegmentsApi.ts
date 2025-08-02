import { createSelector } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import { DaySegment } from '../../types/redux/days'; // Adjust path as needed

export const daySegmentsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDaySegmentss: builder.query<DaySegment[], void>({
			query: () => 'api/daySegments',
			providesTags: ['DaySegments']
		}),
		getDaySegmentsById: builder.query<DaySegment, number>({
			query: id => `api/daySegments/${id}`,
			providesTags: (result, error, id) => [{ type: 'DaySegments', id }]
		}),
		getDaySegmentssByDayId: builder.query<DaySegment[], number>({
			query: dayId => `api/daySegments/dayId/${dayId}`,
			providesTags: (result, error, dayId) => [{ type: 'DaySegments', dayId }]
		}),
		addDaySegments: builder.mutation<void, Omit<DaySegment, 'id'>>({
			query: daySegment => ({
				url: 'api/daySegments/add',
				method: 'POST',
				body: daySegment
			}),
			invalidatesTags: ['DaySegments']
		}),
		editDaySegments: builder.mutation<void, DaySegment>({
			query: daySegment => ({
				url: 'api/daySegments/edit',
				method: 'POST',
				body: daySegment
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', id: arg.id }]
		}),
		deleteDaySegments: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/daySegments/delete',
				method: 'POST',
				body: { id }
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DaySegments', id: arg.id }]
		})
	})
});

export const selectDaySegmentsQueryState = daySegmentsApi.endpoints.getDaySegmentss.select();
export const selectDaySegments = createSelector(
	selectDaySegmentsQueryState,
	({ data: daySegments = [] }) => daySegments
);

export const stableEmptyDaySegments: DaySegment[] = [];

export const {
	useGetDaySegmentssQuery,
	useGetDaySegmentsByIdQuery,
	useGetDaySegmentssByDayIdQuery,
	useAddDaySegmentsMutation,
	useEditDaySegmentsMutation,
	useDeleteDaySegmentsMutation
} = daySegmentsApi;