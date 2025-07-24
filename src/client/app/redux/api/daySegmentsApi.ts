import { createSelector } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import { DaySegment } from '../../types/redux/days'; // Adjust path as needed

export const daySegmentsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDailyPatternSegments: builder.query<DaySegment[], void>({
			query: () => 'api/daySegments',
			providesTags: ['DailyPatternSegment']
		}),
		getDailyPatternSegmentById: builder.query<DaySegment, number>({
			query: id => `api/daySegments/${id}`,
			providesTags: (result, error, id) => [{ type: 'DailyPatternSegment', id }]
		}),
		getDailyPatternSegmentsByDayId: builder.query<DaySegment[], number>({
			query: dayId => `api/daySegments/dayId/${dayId}`,
			providesTags: (result, error, dayId) => [{ type: 'DailyPatternSegment', dayId }]
		}),
		addDailyPatternSegment: builder.mutation<void, Omit<DaySegment, 'id'>>({
			query: daySegment => ({
				url: 'api/daySegments/add',
				method: 'POST',
				body: daySegment
			}),
			invalidatesTags: ['DailyPatternSegment']
		}),
		editDailyPatternSegment: builder.mutation<void, DaySegment>({
			query: daySegment => ({
				url: 'api/daySegments/edit',
				method: 'POST',
				body: daySegment
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DailyPatternSegment', id: arg.id }]
		}),
		deleteDailyPatternSegment: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: 'api/daySegments/delete',
				method: 'POST',
				body: { id }
			}),
			invalidatesTags: (result, error, arg) => [{ type: 'DailyPatternSegment', id: arg.id }]
		})
	})
});

export const selectDaySegmentsQueryState = daySegmentsApi.endpoints.getDailyPatternSegments.select();
export const selectDaySegments = createSelector(
	selectDaySegmentsQueryState,
	({ data: daySegments = [] }) => daySegments
);

export const stableEmptyDaySegments: DaySegment[] = [];

export const {
	useGetDailyPatternSegmentsQuery,
	useGetDailyPatternSegmentByIdQuery,
	useGetDailyPatternSegmentsByDayIdQuery,
	useAddDailyPatternSegmentMutation,
	useEditDailyPatternSegmentMutation,
	useDeleteDailyPatternSegmentMutation
} = daySegmentsApi;